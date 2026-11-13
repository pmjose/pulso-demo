-- ==========================================================================================
-- 08_ai.sql  ·  Cortex AI: enrichment with AI functions + Cortex Search services
--   AI.PAYER_REJECTION_REASONS  AI_CLASSIFY on payer responses (last 14 days; incremental pattern)
--   AI.CLINICAL_NOTE_SIGNALS    AI_EXTRACT risks from clinical notes (sepsis, falls, readmission, allergies)
--   AI.CLINICAL_NOTES_REDACTED  AI_REDACT copy of notes for research (Learning Health)
--   AI.FEEDBACK_SENTIMENT       AI_SENTIMENT by aspect (espera, atendimento, faturação, app)
--   AI.FEEDBACK_THEMES_WEEKLY   AI_SUMMARIZE_AGG of complaints per touchpoint
--   AI.PATIENT_SUMMARIES        AI_COMPLETE clinical summaries for the featured Doente 360° profiles
--   AI.PROTOCOL_SEARCH / AI.CLINICAL_NOTES_SEARCH   Cortex Search services
-- Token estimate (AI_COUNT_TOKENS, input only, a floor): classify ≈ 1.8 M, sentiment ≈ 0.2 M on distinct texts.
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_APP_WH;
USE DATABASE LUZSAUDE_DEMO;
USE SCHEMA AI;

-- ======================= 1. Rejection reasons (AI_CLASSIFY) =======================
CREATE OR REPLACE TABLE AI.PAYER_REJECTION_REASONS (   -- the hourly task in 10_ops adds new responses incrementally
  RESPONSE_ID STRING, INVOICE_ID STRING, PAYER_ID STRING, RECEIVED_AT TIMESTAMP_NTZ, REASON STRING, CLASSIFIED_AT TIMESTAMP_NTZ
) COMMENT = 'Rejection reason classified by AI_CLASSIFY from the payer''s free-text response';

-- Incremental: only responses not classified yet (the task in 10_ops reruns this every hour).
INSERT INTO AI.PAYER_REJECTION_REASONS
SELECT r.RESPONSE_ID, r.INVOICE_ID, r.PAYER_ID, r.RECEIVED_AT,
  AI_CLASSIFY(r.RESPONSE_TEXT,
    [{'label': 'Autorização prévia em falta', 'description': 'falta autorização prévia da seguradora para o ato ou exame'},
     {'label': 'Código de ato incompatível', 'description': 'codificação do ato errada ou incompatível com o diagnóstico ou a tabela'},
     {'label': 'Fora da cobertura', 'description': 'ato não coberto pela apólice ou plafond esgotado'},
     {'label': 'Falta de justificação clínica', 'description': 'diagnóstico não justifica o exame; pedem relatório clínico'},
     {'label': 'Duplicação de ato', 'description': 'ato faturado mais do que uma vez'}],
    {'task_description': 'Classifica o motivo de rejeição de uma fatura hospitalar pela seguradora'}):labels[0]::STRING,
  CURRENT_TIMESTAMP()::TIMESTAMP_NTZ
FROM RAW.PAYER_RESPONSES r
WHERE r.RECEIVED_AT >= DATEADD(day, -14, '2026-11-12'::TIMESTAMP_NTZ)
  AND NOT EXISTS (SELECT 1 FROM AI.PAYER_REJECTION_REASONS x WHERE x.RESPONSE_ID = r.RESPONSE_ID);

-- What the Receita page shows: reasons by payer, before and after AdvanceCare's 1 Nov rule change.
CREATE OR REPLACE VIEW AI.REJECTION_REASONS_BY_PAYER AS
SELECT p.SHORT_NAME AS PAYER, r.REASON, IFF(r.RECEIVED_AT >= '2026-11-01', 'Desde 1/11', 'Antes de 1/11') AS PERIOD, COUNT(*) AS REJECTIONS,
       ROUND(100 * RATIO_TO_REPORT(COUNT(*)) OVER (PARTITION BY p.SHORT_NAME, IFF(r.RECEIVED_AT >= '2026-11-01', 'Desde 1/11', 'Antes de 1/11')), 1) AS SHARE_PCT
FROM AI.PAYER_REJECTION_REASONS r JOIN REF.PAYERS p USING (PAYER_ID)
GROUP BY 1, 2, 3;

-- ======================= 2. Clinical note signals (AI_EXTRACT) =======================
CREATE OR REPLACE TABLE AI.CLINICAL_NOTE_SIGNALS AS
SELECT n.NOTE_ID, n.PATIENT_ID, n.HOSPITAL_ID, n.EPISODE_ID, n.NOTE_TYPE, n.CREATED_AT,
  AI_EXTRACT(text => n.NOTE_TEXT, responseFormat => {
    'sinais_sepsis': 'A nota descreve febre, taquicardia, hipotensão ou lactato elevado compatíveis com sépsis? Responde sim ou não.',
    'risco_queda': 'A nota descreve risco de queda (desorientação, agitação, levantar sozinho, benzodiazepinas)? Responde sim ou não.',
    'risco_readmissao': 'A nota indica risco elevado de readmissão (internamentos repetidos, vive sozinho, não cumpre o plano)? Responde sim ou não.',
    'alergias': 'Que alergias medicamentosas são referidas? Responde nenhuma se não houver.',
    'alta_social': 'O doente aguarda vaga em cuidados continuados ou tem alta social pendente? Responde sim ou não.',
    'lactato': 'Qual o valor de lactato referido, em mmol/L? Responde vazio se não houver.'
  }) AS EXTRACTED
FROM RAW.CLINICAL_NOTES n;

-- AI_EXTRACT is extractive: each answer is the supporting text from the note, or "None".
-- A flag is set when there is evidence, and the evidence is kept for explainability.
CREATE OR REPLACE VIEW AI.CLINICAL_RISKS_TODAY AS
WITH x AS (
  SELECT NOTE_ID, PATIENT_ID, HOSPITAL_ID, EPISODE_ID, NOTE_TYPE, CREATED_AT,
         NULLIF(NULLIF(TRIM(EXTRACTED:response:sinais_sepsis::STRING), 'None'), '') AS SEPSIS_EVIDENCE,
         NULLIF(NULLIF(TRIM(EXTRACTED:response:risco_queda::STRING), 'None'), '') AS FALL_EVIDENCE,
         NULLIF(NULLIF(TRIM(EXTRACTED:response:risco_readmissao::STRING), 'None'), '') AS READMISSION_EVIDENCE,
         NULLIF(NULLIF(TRIM(EXTRACTED:response:alta_social::STRING), 'None'), '') AS SOCIAL_EVIDENCE,
         NULLIF(NULLIF(TRIM(EXTRACTED:response:alergias::STRING), 'None'), '') AS ALLERGY_TEXT,
         TRY_TO_DOUBLE(REPLACE(REGEXP_SUBSTR(EXTRACTED:response:lactato::STRING, '[0-9]+([.,][0-9]+)?'), ',', '.')) AS LACTATE_MMOL
  FROM AI.CLINICAL_NOTE_SIGNALS)
SELECT x.*,
       SEPSIS_EVIDENCE IS NOT NULL AND NOT REGEXP_LIKE(LOWER(SEPSIS_EVIDENCE), '^(n[aã]o|sem).*') AS SEPSIS_SIGNS,
       FALL_EVIDENCE IS NOT NULL AND NOT REGEXP_LIKE(LOWER(FALL_EVIDENCE), '^(n[aã]o|sem).*') AS FALL_RISK,
       READMISSION_EVIDENCE IS NOT NULL AND NOT REGEXP_LIKE(LOWER(READMISSION_EVIDENCE), '^(n[aã]o|sem).*') AS READMISSION_RISK,
       SOCIAL_EVIDENCE IS NOT NULL AND NOT REGEXP_LIKE(LOWER(SOCIAL_EVIDENCE), '^(n[aã]o|sem).*') AS SOCIAL_DISCHARGE,
       IFF(ALLERGY_TEXT IS NULL OR REGEXP_LIKE(LOWER(ALLERGY_TEXT), '.*(sem alergias|nenhuma|desconhec).*'), NULL, LOWER(ALLERGY_TEXT)) AS ALLERGIES
FROM x;

-- ======================= 3. Research copy of notes (AI_REDACT) =======================
CREATE OR REPLACE TABLE AI.CLINICAL_NOTES_REDACTED AS
SELECT SHA2(n.PATIENT_ID || 'luz-research-salt') AS RESEARCH_PATIENT_KEY, n.NOTE_TYPE, DATE_TRUNC('month', n.CREATED_AT) AS NOTE_MONTH,
       AI_REDACT(n.NOTE_TEXT) AS NOTE_TEXT_REDACTED
FROM RAW.CLINICAL_NOTES n JOIN CORE.DIM_PATIENT p ON p.PATIENT_ID = n.PATIENT_ID
WHERE p.CONSENT_RESEARCH;

-- ======================= 4. Feedback sentiment by aspect (AI_SENTIMENT) =======================
-- Scored once per distinct text (repeated comments are common), then joined back to every response.
CREATE OR REPLACE TABLE AI.FEEDBACK_TEXT_SENTIMENT AS
SELECT COMMENT_TEXT, AI_SENTIMENT(COMMENT_TEXT, ['espera', 'atendimento', 'faturação', 'app MY LUZ', 'marcação']) AS SENTIMENT
FROM (SELECT DISTINCT COMMENT_TEXT FROM RAW.CUSTOMER_FEEDBACK);

CREATE OR REPLACE VIEW AI.FEEDBACK_SENTIMENT AS
SELECT f.FEEDBACK_ID, f.HOSPITAL_ID, f.TOUCHPOINT, f.CHANNEL, f.NPS_SCORE, f.CREATED_AT, f.COMMENT_TEXT,
       s.SENTIMENT:categories[0]:sentiment::STRING AS OVERALL_SENTIMENT,
       c.value:name::STRING AS ASPECT, c.value:sentiment::STRING AS ASPECT_SENTIMENT
FROM RAW.CUSTOMER_FEEDBACK f
JOIN AI.FEEDBACK_TEXT_SENTIMENT s ON s.COMMENT_TEXT = f.COMMENT_TEXT,
LATERAL FLATTEN(INPUT => s.SENTIMENT:categories) c
WHERE c.value:name::STRING <> 'overall' AND c.value:sentiment::STRING <> 'unknown';

-- ======================= 5. Weekly complaint themes (AI_SUMMARIZE_AGG) =======================
CREATE OR REPLACE TABLE AI.FEEDBACK_THEMES_WEEKLY AS
SELECT TOUCHPOINT, DATE_TRUNC('week', CREATED_AT) AS WEEK_START, COUNT(*) AS DETRACTORS,
       AI_SUMMARIZE_AGG(COMMENT_TEXT) AS THEMES
FROM (SELECT DISTINCT TOUCHPOINT, CREATED_AT, COMMENT_TEXT FROM RAW.CUSTOMER_FEEDBACK
      WHERE NPS_SCORE <= 6 AND CREATED_AT >= '2026-10-29')
GROUP BY 1, 2;

-- ======================= 6. Patient summaries for Doente 360° (AI_COMPLETE) =======================
CREATE OR REPLACE TABLE AI.PATIENT_SUMMARIES AS
SELECT p.PATIENT_ID, p.PROFILE_ID, p.FULL_NAME,
  AI_COMPLETE('llama3.1-70b',
    'És um assistente clínico de um grupo hospitalar português. Escreve em português de Portugal um resumo clínico de 4 a 5 frases para o médico, '
    || 'sem inventar dados e sem recomendações fora das normas. Dados do doente: '
    || 'idade ' || p.AGE || '; sexo ' || p.SEX || '; problemas ' || p.PROFILE_PROBLEMS::STRING || '; medicação e adesão ' || p.PROFILE_MEDICATIONS::STRING
    || '; riscos previstos ' || p.PROFILE_RISKS::STRING || '; lacunas de cuidados ' || COALESCE(p.PROFILE_CARE_GAPS::STRING, '[]')
    || '; última HbA1c ' || COALESCE(p.LAST_HBA1C::STRING, 'sem registo')
    || '; notas recentes: ' || COALESCE((SELECT LISTAGG(n.NOTE_TEXT, ' | ') FROM RAW.CLINICAL_NOTES n WHERE n.PATIENT_ID = p.PATIENT_ID), 'sem notas'),
    {'temperature': 0.2, 'max_tokens': 350}) AS AI_SUMMARY,
  CURRENT_TIMESTAMP()::TIMESTAMP_NTZ AS GENERATED_AT
FROM CORE.PATIENT_360 p
JOIN REF.PATIENT_PROFILES r ON r.PROFILE_ID = p.PROFILE_ID AND r.IS_FEATURED;

-- ======================= 7. Cortex Search services =======================
-- Protocols and norms (the agent cites them when it recommends an action).
CREATE OR REPLACE CORTEX SEARCH SERVICE AI.PROTOCOL_SEARCH
  ON CONTENT
  ATTRIBUTES CATEGORY, SPECIALTY, OWNER
  WAREHOUSE = LUZ_APP_WH
  TARGET_LAG = '1 day'
  COMMENT = 'Protocolos clínicos e administrativos da Luz Saúde'
  AS (SELECT DOC_ID, TITLE, CATEGORY, SPECIALTY, OWNER, UPDATED_ON::STRING AS UPDATED_ON, TITLE || '. ' || CONTENT AS CONTENT FROM REF.CLINICAL_PROTOCOLS);

-- Clinical notes, for clinicians (the service reads the raw table, so only clinical roles get USAGE).
CREATE OR REPLACE CORTEX SEARCH SERVICE AI.CLINICAL_NOTES_SEARCH
  ON NOTE_TEXT
  ATTRIBUTES HOSPITAL_ID, NOTE_TYPE, PATIENT_ID
  WAREHOUSE = LUZ_APP_WH
  TARGET_LAG = '1 hour'
  COMMENT = 'Pesquisa semântica nas notas clínicas (apenas perfis clínicos)'
  AS (SELECT NOTE_ID, PATIENT_ID, HOSPITAL_ID, NOTE_TYPE, CREATED_AT::STRING AS CREATED_AT, NOTE_TEXT FROM RAW.CLINICAL_NOTES);

GRANT USAGE ON SCHEMA AI TO ROLE LUZ_APP;
GRANT USAGE ON SCHEMA AI TO ROLE LUZ_CLINICO;
GRANT SELECT ON ALL TABLES IN SCHEMA AI TO ROLE LUZ_APP;
GRANT SELECT ON ALL VIEWS IN SCHEMA AI TO ROLE LUZ_APP;
GRANT USAGE ON CORTEX SEARCH SERVICE AI.PROTOCOL_SEARCH TO ROLE LUZ_APP;
GRANT USAGE ON CORTEX SEARCH SERVICE AI.PROTOCOL_SEARCH TO ROLE LUZ_CLINICO;
GRANT USAGE ON CORTEX SEARCH SERVICE AI.CLINICAL_NOTES_SEARCH TO ROLE LUZ_CLINICO;
GRANT SELECT ON TABLE AI.CLINICAL_NOTES_REDACTED TO ROLE LUZ_INVESTIGACAO;
GRANT USAGE ON SCHEMA AI TO ROLE LUZ_INVESTIGACAO;
