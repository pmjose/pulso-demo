-- ==========================================================================================
-- 06_semantic_views.sql  ·  Certified semantic views (one definition for portal, Luz IA, BI)
-- Names match the "Semantic view" column of the KPI dictionary: SV_OPERACOES, SV_URGENCIA,
-- SV_INTERNAMENTOS, SV_BLOCO, SV_AMBULATORIO, SV_RECEITA, SV_FINANCAS, SV_QUALIDADE,
-- SV_PESSOAS, SV_EXPERIENCIA. Synonyms are in Portuguese so Cortex Analyst understands pt-PT.
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_APP_WH;
USE DATABASE LUZSAUDE_DEMO;
USE SCHEMA SEMANTIC;

-- ---------- Operações ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_OPERACOES
  TABLES (
    dia AS CORE.HOSPITAL_DAY_KPI PRIMARY KEY (HOSPITAL_ID, KPI_DATE)
      WITH SYNONYMS ('indicadores diários', 'operações') COMMENT = 'Indicadores operacionais por hospital e dia',
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
      WITH SYNONYMS ('hospitais', 'unidades') COMMENT = 'Hospitais do grupo Luz Saúde'
  )
  RELATIONSHIPS (dia_hospital AS dia (HOSPITAL_ID) REFERENCES hospitais)
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME WITH SYNONYMS = ('hospital', 'unidade') COMMENT = 'Nome curto do hospital, por exemplo HL Lisboa',
    hospitais.regiao AS hospitais.REGION WITH SYNONYMS = ('região') COMMENT = 'Região: Lisboa, Norte, Centro, Sul ou Madeira',
    hospitais.e_nova_unidade AS hospitais.IS_NEW COMMENT = 'Unidade aberta desde 2025 (Aveiro, Leiria, Santarém, Figueira da Foz)',
    dia.data AS dia.KPI_DATE WITH SYNONYMS = ('dia', 'data') COMMENT = 'Data do indicador',
    dia.mes AS DATE_TRUNC('month', dia.KPI_DATE) WITH SYNONYMS = ('mês') COMMENT = 'Mês',
    dia.semana AS DATE_TRUNC('week', dia.KPI_DATE) WITH SYNONYMS = ('semana') COMMENT = 'Semana (segunda-feira)'
  )
  METRICS (
    dia.ocupacao_pct AS 100 * SUM(dia.BEDS_OCCUPIED) / NULLIF(SUM(dia.BEDS), 0)
      WITH SYNONYMS = ('ocupação', 'taxa de ocupação', 'ocupação de internamento') COMMENT = 'Ocupação de internamento: camas ocupadas à meia-noite ÷ camas disponíveis (%)',
    dia.camas_ocupadas_media AS AVG(dia.BEDS_OCCUPIED) COMMENT = 'Média diária de camas ocupadas',
    dia.episodios_urgencia AS SUM(dia.ER_VISITS) WITH SYNONYMS = ('urgências', 'episódios de urgência') COMMENT = 'Número de episódios de urgência',
    dia.espera_urgencia_min AS SUM(dia.ER_WAIT_AVG_MIN * dia.ER_VISITS) / NULLIF(SUM(dia.ER_VISITS), 0)
      WITH SYNONYMS = ('espera na urgência', 'tempo de espera') COMMENT = 'Espera média até à primeira observação médica (minutos)',
    dia.admissoes AS SUM(dia.ADMISSIONS) WITH SYNONYMS = ('internamentos', 'admissões') COMMENT = 'Admissões em internamento',
    dia.altas AS SUM(dia.DISCHARGES) COMMENT = 'Altas de internamento',
    dia.altas_antes_12h_pct AS 100 * SUM(dia.DISCHARGES_BEFORE_NOON) / NULLIF(SUM(dia.DISCHARGES), 0) COMMENT = '% de altas antes das 12h (meta 30%)',
    dia.cirurgias AS SUM(dia.SURGERIES) COMMENT = 'Cirurgias realizadas',
    dia.urgencias_respiratorias_pct AS 100 * SUM(dia.ER_RESPIRATORY) / NULLIF(SUM(dia.ER_VISITS), 0) COMMENT = '% de episódios de urgência por causa respiratória'
  )
  COMMENT = 'Operações hospitalares: ocupação, urgência, admissões, altas e cirurgias por hospital e dia'
  AI_SQL_GENERATION 'Responde em português de Portugal. Percentagens com uma casa decimal. Hoje é 12/11/2026; os dados vão até 11/11/2026.';

-- ---------- Urgência ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_URGENCIA
  TABLES (
    urgencia AS CORE.ER_EPISODE PRIMARY KEY (ER_EPISODE_ID) WITH SYNONYMS ('urgência', 'episódios de urgência') COMMENT = 'Episódios de urgência com triagem de Manchester',
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (urgencia_hospital AS urgencia (HOSPITAL_ID) REFERENCES hospitais)
  FACTS (
    urgencia.dentro_alvo AS IFF(urgencia.WAIT_FIRST_PHYSICIAN_MIN <= urgencia.TRIAGE_TARGET_MIN, 1, 0) COMMENT = '1 se o doente foi visto dentro do tempo-alvo da triagem'
  )
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME WITH SYNONYMS = ('hospital', 'unidade'),
    hospitais.regiao AS hospitais.REGION,
    urgencia.triagem AS urgencia.TRIAGE_LEVEL WITH SYNONYMS = ('prioridade', 'cor da triagem', 'Manchester') COMMENT = 'Vermelho, Laranja, Amarelo, Verde ou Azul',
    urgencia.motivo AS urgencia.REASON_GROUP WITH SYNONYMS = ('motivo', 'queixa') COMMENT = 'Grupo de motivo: Respiratória, Trauma, Dor torácica, ...',
    urgencia.data AS urgencia.ARRIVAL_DATE COMMENT = 'Data de chegada',
    urgencia.hora AS urgencia.ARRIVAL_HOUR COMMENT = 'Hora de chegada (0-23)',
    urgencia.dia_semana AS DAYNAME(urgencia.ARRIVAL_DATE) COMMENT = 'Dia da semana',
    urgencia.internado AS urgencia.ADMITTED COMMENT = 'Se o episódio deu origem a internamento'
  )
  METRICS (
    urgencia.episodios AS COUNT(urgencia.ER_EPISODE_ID) WITH SYNONYMS = ('número de urgências', 'afluência'),
    urgencia.espera_media_min AS AVG(urgencia.WAIT_FIRST_PHYSICIAN_MIN) WITH SYNONYMS = ('espera média', 'tempo de espera'),
    urgencia.dentro_tempo_alvo_pct AS 100 * AVG(urgencia.dentro_alvo) COMMENT = '% de doentes vistos dentro do tempo-alvo de Manchester',
    urgencia.taxa_internamento_pct AS 100 * AVG(IFF(urgencia.ADMITTED, 1, 0)) COMMENT = '% de episódios que ficaram internados'
  )
  COMMENT = 'Urgência: afluência, triagem de Manchester, tempos de espera e internamentos'
  AI_SQL_GENERATION 'Responde em português de Portugal. Hoje é 12/11/2026.';

-- ---------- Internamentos ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_INTERNAMENTOS
  TABLES (
    internamentos AS CORE.INPATIENT_EPISODE PRIMARY KEY (EPISODE_ID) WITH SYNONYMS ('episódios de internamento'),
    doentes AS CORE.DIM_PATIENT PRIMARY KEY (PATIENT_ID) WITH SYNONYMS ('doentes', 'clientes'),
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (
    int_hospital AS internamentos (HOSPITAL_ID) REFERENCES hospitais,
    int_doente AS internamentos (PATIENT_ID) REFERENCES doentes
  )
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME WITH SYNONYMS = ('hospital', 'unidade'),
    hospitais.regiao AS hospitais.REGION,
    internamentos.especialidade AS internamentos.SPECIALTY WITH SYNONYMS = ('serviço', 'especialidade'),
    internamentos.diagnostico AS internamentos.DIAGNOSIS WITH SYNONYMS = ('diagnóstico'),
    internamentos.destino AS internamentos.DISPOSITION COMMENT = 'Domicílio ou Transferência',
    internamentos.data_admissao AS internamentos.ADMISSION_DATE,
    internamentos.mes_admissao AS DATE_TRUNC('month', internamentos.ADMISSION_DATE),
    internamentos.em_curso AS internamentos.IS_ACTIVE COMMENT = 'Doente ainda internado',
    doentes.faixa_etaria AS doentes.AGE_BAND WITH SYNONYMS = ('idade', 'faixa etária'),
    doentes.sexo AS doentes.SEX,
    doentes.financiador AS doentes.MAIN_PAYER WITH SYNONYMS = ('seguradora', 'financiador')
  )
  METRICS (
    internamentos.episodios AS COUNT(internamentos.EPISODE_ID) WITH SYNONYMS = ('internamentos', 'admissões'),
    internamentos.demora_media_dias AS AVG(IFF(internamentos.IS_ACTIVE, NULL, internamentos.LOS_DAYS)) WITH SYNONYMS = ('demora média', 'duração do internamento'),
    internamentos.readmissoes_30d_pct AS 100 * AVG(IFF(internamentos.READMITTED_30D, 1, 0)) WITH SYNONYMS = ('readmissões', 'taxa de readmissão') COMMENT = '% de altas com nova admissão em 30 dias',
    internamentos.altas_antes_12h_pct AS 100 * AVG(IFF(internamentos.DISCHARGED_BEFORE_NOON, 1, 0))
  )
  COMMENT = 'Internamentos: episódios, demora média, readmissões a 30 dias, por hospital, serviço e perfil do doente'
  AI_SQL_GENERATION 'Responde em português de Portugal. Demora média com uma casa decimal.';

-- ---------- Bloco operatório ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_BLOCO
  TABLES (
    cirurgias AS CORE.SURGERY PRIMARY KEY (CASE_ID) WITH SYNONYMS ('cirurgias', 'bloco', 'bloco operatório'),
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (cx_hospital AS cirurgias (HOSPITAL_ID) REFERENCES hospitais)
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME WITH SYNONYMS = ('hospital'),
    cirurgias.sala AS cirurgias.ROOM_ID WITH SYNONYMS = ('sala', 'sala operatória'),
    cirurgias.especialidade AS cirurgias.SPECIALTY,
    cirurgias.procedimento AS cirurgias.PROCEDURE_NAME WITH SYNONYMS = ('procedimento', 'cirurgia'),
    cirurgias.cirurgiao AS cirurgias.SURGEON WITH SYNONYMS = ('cirurgião', 'médico'),
    cirurgias.data AS cirurgias.SURGERY_DATE,
    cirurgias.semana AS DATE_TRUNC('week', cirurgias.SURGERY_DATE),
    cirurgias.robotica AS cirurgias.IS_ROBOTIC,
    cirurgias.motivo_cancelamento AS cirurgias.CANCEL_REASON WITH SYNONYMS = ('motivo de cancelamento')
  )
  METRICS (
    cirurgias.realizadas AS COUNT_IF(NOT cirurgias.CANCELLED_SAME_DAY) WITH SYNONYMS = ('cirurgias realizadas', 'número de cirurgias'),
    cirurgias.canceladas_pct AS 100 * AVG(IFF(cirurgias.CANCELLED_SAME_DAY, 1, 0)) WITH SYNONYMS = ('taxa de cancelamento', 'cancelamentos'),
    cirurgias.duracao_media_min AS AVG(IFF(cirurgias.CANCELLED_SAME_DAY, NULL, cirurgias.ACTUAL_DURATION_MIN)),
    cirurgias.desvio_estimativa_min AS AVG(IFF(cirurgias.CANCELLED_SAME_DAY, NULL, cirurgias.OVERRUN_MIN)) COMMENT = 'Minutos acima da estimativa do cirurgião',
    cirurgias.limpeza_media_min AS AVG(cirurgias.TURNOVER_MIN) WITH SYNONYMS = ('tempo de limpeza', 'turnover', 'preparação entre cirurgias'),
    cirurgias.primeira_a_horas_pct AS 100 * AVG(IFF(cirurgias.IS_FIRST_CASE AND NOT cirurgias.CANCELLED_SAME_DAY, IFF(cirurgias.START_DELAY_MIN <= 15, 1, 0), NULL))
      WITH SYNONYMS = ('primeira cirurgia a horas') COMMENT = '% de primeiras cirurgias do dia que começaram até 15 min depois das 8h',
    cirurgias.uci_pos_operatoria_pct AS 100 * AVG(IFF(cirurgias.ICU_AFTER, 1, 0))
  )
  COMMENT = 'Bloco operatório: cirurgias, cancelamentos, durações, tempos de limpeza e primeira cirurgia a horas'
  AI_SQL_GENERATION 'Responde em português de Portugal. O tempo-alvo de limpeza entre cirurgias é 22 minutos.';

-- ---------- Ambulatório ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_AMBULATORIO
  TABLES (consultas AS CORE.APPOINTMENT PRIMARY KEY (APPOINTMENT_ID) WITH SYNONYMS ('consultas', 'marcações', 'ambulatório'))
  DIMENSIONS (
    consultas.unidade AS consultas.UNIT_NAME WITH SYNONYMS = ('hospital', 'clínica', 'unidade'),
    consultas.tipo_unidade AS consultas.UNIT_TYPE COMMENT = 'Hospital ou Clínica',
    consultas.regiao AS consultas.REGION,
    consultas.especialidade AS consultas.SPECIALTY,
    consultas.canal AS consultas.BOOKING_CHANNEL WITH SYNONYMS = ('canal de marcação'),
    consultas.data AS consultas.APPOINTMENT_DATE,
    consultas.mes AS DATE_TRUNC('month', consultas.APPOINTMENT_DATE),
    consultas.estado AS consultas.STATUS COMMENT = 'Realizada, Falta ou Marcada (futura)',
    consultas.teleconsulta AS consultas.IS_TELECONSULT,
    consultas.primeira_consulta AS consultas.IS_FIRST_VISIT
  )
  METRICS (
    consultas.realizadas AS COUNT_IF(consultas.STATUS = 'Realizada') WITH SYNONYMS = ('consultas realizadas'),
    consultas.marcadas_futuras AS COUNT_IF(consultas.STATUS = 'Marcada'),
    consultas.taxa_faltas_pct AS 100 * COUNT_IF(consultas.NO_SHOW) / NULLIF(COUNT_IF(consultas.STATUS <> 'Marcada'), 0) WITH SYNONYMS = ('faltas', 'no-show', 'taxa de faltas'),
    consultas.teleconsulta_pct AS 100 * AVG(IFF(consultas.IS_TELECONSULT, 1, 0)),
    consultas.antecedencia_media_dias AS AVG(consultas.LEAD_DAYS) COMMENT = 'Dias entre a marcação e a consulta',
    consultas.marcacoes_app_pct AS 100 * AVG(IFF(consultas.BOOKING_CHANNEL = 'App MY LUZ', 1, 0)) WITH SYNONYMS = ('marcações pela app')
  )
  COMMENT = 'Ambulatório: consultas em hospitais e clínicas, faltas, teleconsulta e canais de marcação'
  AI_SQL_GENERATION 'Responde em português de Portugal. A taxa de faltas exclui consultas futuras.';

-- ---------- Receita e seguradoras ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_RECEITA
  TABLES (
    faturas AS CORE.INVOICE PRIMARY KEY (INVOICE_ID) WITH SYNONYMS ('faturas', 'faturação', 'processos'),
    financiadores AS REF.PAYERS PRIMARY KEY (PAYER_ID) WITH SYNONYMS ('seguradoras', 'financiadores', 'entidades'),
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (
    fat_financiador AS faturas (PAYER_ID) REFERENCES financiadores,
    fat_hospital AS faturas (HOSPITAL_ID) REFERENCES hospitais
  )
  DIMENSIONS (
    financiadores.financiador AS financiadores.SHORT_NAME WITH SYNONYMS = ('seguradora', 'pagador', 'entidade'),
    financiadores.tipo_financiador AS financiadores.PAYER_TYPE,
    hospitais.hospital AS hospitais.SHORT_NAME WITH SYNONYMS = ('hospital'),
    faturas.tipo_episodio AS faturas.EPISODE_TYPE COMMENT = 'Urgência, Internamento, Cirurgia, Consulta ou Exame',
    faturas.especialidade AS faturas.SPECIALTY,
    faturas.estado AS faturas.STATUS COMMENT = 'Paga, Pendente, Rejeitada ou Por enviar',
    faturas.data_servico AS faturas.SERVICE_DATE,
    faturas.mes AS DATE_TRUNC('month', faturas.SERVICE_DATE),
    faturas.semana AS DATE_TRUNC('week', faturas.SERVICE_DATE),
    faturas.imagiologia AS faturas.IS_IMAGING
  )
  METRICS (
    faturas.receita_meur AS SUM(faturas.AMOUNT_EUR) / 1e6 WITH SYNONYMS = ('receita', 'faturação', 'valor faturado') COMMENT = 'Receita faturada em milhões de euros',
    faturas.taxa_rejeicao_pct AS 100 * COUNT_IF(faturas.IS_REJECTED) / NULLIF(COUNT_IF(faturas.STATUS <> 'Por enviar'), 0) WITH SYNONYMS = ('rejeições', 'glosas', 'taxa de rejeição'),
    faturas.valor_rejeitado_meur AS SUM(IFF(faturas.IS_REJECTED, faturas.AMOUNT_EUR, 0)) / 1e6,
    faturas.prazo_medio_recebimento_dias AS AVG(faturas.DAYS_TO_PAY) WITH SYNONYMS = ('PMR', 'prazo médio de recebimento', 'DSO'),
    faturas.valor_pendente_meur AS SUM(IFF(faturas.STATUS = 'Pendente', faturas.AMOUNT_EUR, 0)) / 1e6,
    faturas.sem_autorizacao_previa AS COUNT_IF(faturas.NEEDS_PRIOR_AUTH AND NOT faturas.HAS_PRIOR_AUTH) COMMENT = 'Atos que exigiam autorização prévia e não a tinham'
  )
  COMMENT = 'Receita e seguradoras: faturação, rejeições, prazo médio de recebimento e autorizações prévias'
  AI_SQL_GENERATION 'Responde em português de Portugal. Valores monetários em milhões de euros com uma casa decimal.';

-- ---------- Finanças (receita real vs. orçamento 2026) ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_FINANCAS
  TABLES (
    plano AS REF.PLAN_MONTHLY_2026 PRIMARY KEY (MONTH_NUM) WITH SYNONYMS ('orçamento', 'plano 2026') COMMENT = 'Receita mensal real, orçamento e previsão de 2026 (M€)',
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID) COMMENT = 'Receita 2025 e margem operacional por hospital'
  )
  DIMENSIONS (
    plano.mes AS plano.MONTH_LABEL WITH SYNONYMS = ('mês'),
    plano.mes_numero AS plano.MONTH_NUM,
    hospitais.hospital AS hospitais.SHORT_NAME,
    hospitais.regiao AS hospitais.REGION
  )
  METRICS (
    plano.receita_real_meur AS SUM(plano.ACTUAL_MEUR) WITH SYNONYMS = ('receita real'),
    plano.orcamento_meur AS SUM(plano.BUDGET_MEUR) WITH SYNONYMS = ('orçamento'),
    plano.previsao_meur AS SUM(COALESCE(plano.ACTUAL_MEUR, plano.FORECAST_MEUR)) WITH SYNONYMS = ('previsão de fecho') COMMENT = 'Real até outubro mais previsão de novembro e dezembro',
    hospitais.receita_2025_meur AS SUM(hospitais.REVENUE_2025_MEUR),
    hospitais.margem_media_pct AS AVG(hospitais.MARGIN_PCT) WITH SYNONYMS = ('margem', 'margem operacional')
  )
  COMMENT = 'Finanças: receita real, orçamento e previsão de 2026; receita e margem por hospital'
  AI_SQL_GENERATION 'Responde em português de Portugal. O orçamento anual de 2026 é 868 M€ e a previsão de fecho 875 M€.';

-- ---------- Qualidade clínica ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_QUALIDADE
  TABLES (
    internamentos AS CORE.INPATIENT_EPISODE PRIMARY KEY (EPISODE_ID),
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (q_hospital AS internamentos (HOSPITAL_ID) REFERENCES hospitais)
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME,
    hospitais.regiao AS hospitais.REGION,
    internamentos.especialidade AS internamentos.SPECIALTY,
    internamentos.mes AS DATE_TRUNC('month', internamentos.DISCHARGE_DATE)
  )
  METRICS (
    internamentos.readmissoes_30d_pct AS 100 * AVG(IFF(internamentos.READMITTED_30D, 1, 0)) WITH SYNONYMS = ('readmissões') COMMENT = 'Referência nacional: 8,1%',
    internamentos.sepsis_pct AS 100 * AVG(IFF(internamentos.DIAGNOSIS_CODE = 'A41.9', 1, 0)) COMMENT = '% de episódios com sépsis',
    hospitais.iacs_pct AS AVG(hospitais.TARGET_IACS_PCT) WITH SYNONYMS = ('infeção hospitalar', 'IACS') COMMENT = 'Referência nacional: 5,0%',
    hospitais.complicacoes_pct AS AVG(hospitais.TARGET_COMPL_PCT) WITH SYNONYMS = ('complicações cirúrgicas') COMMENT = 'Referência nacional: 2,6%'
  )
  COMMENT = 'Qualidade clínica: readmissões, infeção hospitalar e complicações, por hospital e serviço'
  AI_SQL_GENERATION 'Responde em português de Portugal e compara com as referências nacionais quando relevante.';

-- ---------- Pessoas ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_PESSOAS
  TABLES (colaboradores AS CORE.EMPLOYEE_360 PRIMARY KEY (EMPLOYEE_ID) WITH SYNONYMS ('colaboradores', 'profissionais', 'equipa'))
  DIMENSIONS (
    colaboradores.hospital AS colaboradores.HOSPITAL,
    colaboradores.funcao AS colaboradores.ROLE_NAME WITH SYNONYMS = ('função', 'categoria'),
    colaboradores.servico AS colaboradores.SERVICE WITH SYNONYMS = ('serviço'),
    colaboradores.tipo_contrato AS colaboradores.CONTRACT_TYPE,
    colaboradores.faz_noites AS colaboradores.WORKS_NIGHTS
  )
  METRICS (
    colaboradores.numero AS COUNT(colaboradores.EMPLOYEE_ID) WITH SYNONYMS = ('número de colaboradores', 'headcount'),
    colaboradores.horas_extra_4s AS SUM(colaboradores.OVERTIME_HOURS_4W) WITH SYNONYMS = ('horas extra'),
    colaboradores.horas_extra_media AS AVG(colaboradores.OVERTIME_HOURS_4W),
    colaboradores.noites_14d_media AS AVG(colaboradores.NIGHTS_14D),
    colaboradores.descansos_curtos AS SUM(colaboradores.SHORT_RESTS_4W) COMMENT = 'Descansos inferiores a 11 h entre turnos (4 semanas)',
    colaboradores.avaliacao_media AS AVG(colaboradores.PERFORMANCE_RATING),
    colaboradores.antiguidade_media_anos AS AVG(colaboradores.YEARS_OF_SERVICE)
  )
  COMMENT = 'Pessoas e capacidade: colaboradores, horas extra, noites e descanso'
  AI_SQL_GENERATION 'Responde em português de Portugal. Não uses género, idade ou nacionalidade para explicar risco de saída.';

-- ---------- Experiência do cliente ----------
CREATE OR REPLACE SEMANTIC VIEW SEMANTIC.SV_EXPERIENCIA
  TABLES (
    respostas AS RAW.CUSTOMER_FEEDBACK PRIMARY KEY (FEEDBACK_ID) WITH SYNONYMS ('inquéritos', 'reclamações', 'comentários'),
    hospitais AS REF.HOSPITALS PRIMARY KEY (HOSPITAL_ID)
  )
  RELATIONSHIPS (r_hospital AS respostas (HOSPITAL_ID) REFERENCES hospitais)
  DIMENSIONS (
    hospitais.hospital AS hospitais.SHORT_NAME,
    respostas.ponto_contacto AS respostas.TOUCHPOINT WITH SYNONYMS = ('ponto de contacto'),
    respostas.canal AS respostas.CHANNEL COMMENT = 'Inquérito NPS ou Livro de Reclamações',
    respostas.semana AS DATE_TRUNC('week', respostas.CREATED_AT)
  )
  METRICS (
    respostas.nps AS 100 * (COUNT_IF(respostas.NPS_SCORE >= 9) - COUNT_IF(respostas.NPS_SCORE <= 6)) / NULLIF(COUNT(respostas.NPS_SCORE), 0) WITH SYNONYMS = ('NPS', 'satisfação'),
    respostas.respostas AS COUNT(respostas.FEEDBACK_ID),
    respostas.reclamacoes AS COUNT_IF(respostas.CHANNEL = 'Livro de Reclamações')
  )
  COMMENT = 'Experiência do cliente: NPS e reclamações por hospital e ponto de contacto'
  AI_SQL_GENERATION 'Responde em português de Portugal.';

GRANT USAGE ON SCHEMA SEMANTIC TO ROLE LUZ_APP;
GRANT USAGE ON SCHEMA SEMANTIC TO ROLE LUZ_CLINICO;
GRANT USAGE ON SCHEMA SEMANTIC TO ROLE LUZ_FINANCAS;
GRANT USAGE ON SCHEMA SEMANTIC TO ROLE LUZ_DIRECAO_HOSPITAL;
GRANT SELECT ON ALL SEMANTIC VIEWS IN SCHEMA SEMANTIC TO ROLE LUZ_APP;
GRANT SELECT ON ALL SEMANTIC VIEWS IN SCHEMA SEMANTIC TO ROLE LUZ_CLINICO;
GRANT SELECT ON ALL SEMANTIC VIEWS IN SCHEMA SEMANTIC TO ROLE LUZ_FINANCAS;
GRANT SELECT ON ALL SEMANTIC VIEWS IN SCHEMA SEMANTIC TO ROLE LUZ_DIRECAO_HOSPITAL;
GRANT USAGE ON SCHEMA RAW TO ROLE LUZ_APP;
GRANT SELECT ON TABLE RAW.CUSTOMER_FEEDBACK TO ROLE LUZ_APP;
