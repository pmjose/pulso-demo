-- ==========================================================================================
-- 03c_seed_business.sql  ·  Invoices and payer responses, stock (SAP), rosters (UKG),
-- MY LUZ events, clinical notes, customer feedback, protocols and the source-system catalogue.
-- Revenue is calibrated to ≈ 870 M€ over the 12-month window (2026 forecast 875 M€).
-- Planted signal: from 1 Nov 2026 AdvanceCare requires prior authorisation for more imaging
-- exams, so its rejection rate rises from ≈ 3.1% to ≈ 4.9% (the anomaly the portal flags).
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_LOAD_WH;
USE DATABASE LUZSAUDE_DEMO;

-- ---------- Faturação · one invoice per episode ----------
INSERT OVERWRITE INTO RAW.BILLING_INVOICES
WITH ep AS (
  SELECT RESOURCE:id::STRING episode_id, 'Urgência' etype, RESOURCE:serviceProvider:reference::STRING hosp_ref, REPLACE(RESOURCE:subject:reference::STRING, 'Patient/', '') pid,
         'Urgência' spec, TO_DATE(RESOURCE:period:start::STRING) sdate, 140 * EXP(0.35 * REF.N(RESOURCE_ID || 'amt')) amt, FALSE imaging
  FROM RAW.HIS_ER_ENCOUNTER_FHIR
  UNION ALL
  SELECT MSG:PV1:"19"::STRING, 'Internamento', 'Organization/' || MSG:PV1:"3":"4"::STRING, MSG:PID:"3"::STRING, MSG:PV1:"10"::STRING,
         TO_DATE(MSG:PV1:"44"::STRING, 'YYYYMMDDHH24MISS'), 2900 * EXP(0.45 * REF.N(MSG_ID || 'amt')), FALSE
  FROM RAW.HIS_ADT_HL7 WHERE MSG_TYPE = 'ADT^A01'
  UNION ALL
  SELECT CASE_ID, 'Cirurgia', 'Organization/' || HOSPITAL_ID, PATIENT_ID, SPECIALTY, SURGERY_DATE, 4300 * (SURGEON_ESTIMATE_MIN / 100) * EXP(0.25 * REF.N(CASE_ID || 'amt')), FALSE
  FROM RAW.HIS_SURGERY_LOG WHERE NOT CANCELLED_SAME_DAY
  UNION ALL
  SELECT APPOINTMENT_ID, IFF(SPECIALTY = 'Imagiologia', 'Exame', 'Consulta'), 'Organization/' || UNIT_ID, PATIENT_ID, SPECIALTY, TO_DATE(APPOINTMENT_TS),
         IFF(SPECIALTY = 'Imagiologia', 110, 52) * EXP(0.30 * REF.N(APPOINTMENT_ID || 'amt')), SPECIALTY = 'Imagiologia'
  FROM RAW.HIS_APPOINTMENTS WHERE STATUS = 'Realizada'
), p AS (SELECT PAYER_ID, SHORT_NAME, TARGET_DSO_DAYS, SUM(REVENUE_SHARE_PCT) OVER (ORDER BY PAYER_ID) / 100 cum FROM REF.PAYERS),
x AS (
  SELECT ep.*, REPLACE(hosp_ref, 'Organization/', '') unit_id,
    (SELECT MIN(PAYER_ID) FROM p WHERE p.cum >= REF.U(episode_id || 'payer')) payer_id,
    DATEADD(day, 2 + FLOOR(REF.U(episode_id || 'inv') * 6), sdate) inv_date
  FROM ep
), y AS (
  SELECT x.*, p.SHORT_NAME payer, p.TARGET_DSO_DAYS dso,
    payer_id NOT IN ('P6', 'P7') AND (imaging OR etype IN ('Cirurgia', 'Internamento')) needs_auth,
    -- AdvanceCare changed its imaging list on 1 Nov 2026: authorisations requested under the old list are missing.
    REF.U(episode_id || 'auth') < CASE WHEN payer_id = 'P3' AND imaging AND sdate >= '2026-11-01' THEN 0.64 WHEN payer_id = 'P3' THEN 0.955 ELSE 0.99 END has_auth
  FROM x JOIN p USING (PAYER_ID)
)
SELECT 'FT-' || episode_id, episode_id, etype,
  IFF(LEFT(unit_id, 1) = 'C', 'H01', unit_id), pid, payer_id, spec, sdate, inv_date, ROUND(amt * 0.9894, 2), has_auth, needs_auth, imaging,
  CASE WHEN inv_date > '2026-11-11' THEN 'Por enviar'
       WHEN (needs_auth AND NOT has_auth) OR REF.U(episode_id || 'rej') < DECODE(payer_id, 'P1', 0.035, 'P2', 0.039, 'P3', 0.0262, 'P4', 0.046, 'P5', 0.049, 'P6', 0.045, 0.004) THEN 'Rejeitada'
       WHEN DATEADD(day, dso * EXP(0.25 * REF.N(episode_id || 'dso')), inv_date) <= '2026-11-11' THEN 'Paga'
       ELSE 'Pendente' END,
  IFF(DATEADD(day, dso * EXP(0.25 * REF.N(episode_id || 'dso')), inv_date) <= '2026-11-11', DATEADD(day, ROUND(dso * EXP(0.25 * REF.N(episode_id || 'dso'))), inv_date), NULL),
  DATEADD(hour, 6, inv_date::TIMESTAMP_NTZ)
FROM y;

-- Paid status must not survive on rejected invoices.
UPDATE RAW.BILLING_INVOICES SET PAID_DATE = NULL WHERE STATUS IN ('Rejeitada', 'Por enviar', 'Pendente');

-- Monthly seasonality: scale each service month to the portal's monthly revenue
-- (Jan-Oct 2026 actuals; Nov-Dec 2025 ≈ 7.5% below the 2026 Nov-Dec forecast; Nov 2026 to date pro rata).
UPDATE RAW.BILLING_INVOICES b SET AMOUNT_EUR = ROUND(b.AMOUNT_EUR * t.factor, 2)
FROM (
  WITH target AS (
    SELECT DATE_FROM_PARTS(2026, MONTH_NUM, 1) m, ACTUAL_MEUR v FROM REF.PLAN_MONTHLY_2026 WHERE ACTUAL_MEUR IS NOT NULL
    UNION ALL SELECT '2025-11-01'::DATE, 62.4 * 0.925 * 19 / 30 UNION ALL SELECT '2025-12-01'::DATE, 56.4 * 0.925
    UNION ALL SELECT '2026-11-01'::DATE, 62.4 * 11 / 30),
  actual AS (SELECT DATE_TRUNC('month', SERVICE_DATE) m, SUM(AMOUNT_EUR) / 1e6 v FROM RAW.BILLING_INVOICES WHERE SERVICE_DATE <= '2026-11-11' GROUP BY 1)
  SELECT a.m, t.v / a.v AS factor FROM actual a JOIN target t ON t.m = a.m) t
WHERE DATE_TRUNC('month', b.SERVICE_DATE) = t.m;

-- ---------- Seguradoras · free-text responses to rejected claims (Portuguese) ----------
INSERT OVERWRITE INTO RAW.PAYER_RESPONSES
WITH r AS (SELECT INVOICE_ID, PAYER_ID, INVOICE_DATE, SPECIALTY, AMOUNT_EUR, NEEDS_PRIOR_AUTH, HAS_PRIOR_AUTH, IS_IMAGING FROM RAW.BILLING_INVOICES WHERE STATUS = 'Rejeitada'),
t AS (
  SELECT r.*, p.NAME payer_name,
    CASE WHEN NEEDS_PRIOR_AUTH AND NOT HAS_PRIOR_AUTH THEN 0 ELSE 1 + MOD(ABS(HASH(INVOICE_ID, 'why')), 4) END why,
    MOD(ABS(HASH(INVOICE_ID, 'tpl')), 3) tpl
  FROM r JOIN REF.PAYERS p USING (PAYER_ID)
)
SELECT 'RS-' || INVOICE_ID, INVOICE_ID, PAYER_ID, DATEADD(hour, 30 + FLOOR(REF.U(INVOICE_ID || 'rt') * 200), INVOICE_DATE::TIMESTAMP_NTZ), 'Rejeitada',
  CASE why
    WHEN 0 THEN DECODE(tpl,
      0, 'Exmos. Senhores, informamos que o processo ' || INVOICE_ID || ' foi devolvido por não existir autorização prévia válida para o ato de ' || LOWER(SPECIALTY) || '. Solicitamos o envio do pedido de autorização antes de nova faturação. ' || payer_name,
      1, 'Fatura ' || INVOICE_ID || ' não aceite: o exame faz parte da lista de atos sujeitos a autorização prévia em vigor desde 01/11/2026 e não foi encontrado pedido associado.',
      'Devolução do processo ' || INVOICE_ID || '. Motivo: falta de autorização prévia da ' || payer_name || ' para o procedimento faturado (' || AMOUNT_EUR || ' €).')
    WHEN 1 THEN DECODE(tpl,
      0, 'O código de ato indicado na fatura ' || INVOICE_ID || ' não é compatível com o diagnóstico registado. Por favor, corrijam a codificação e reenviem.',
      1, 'Processo ' || INVOICE_ID || ' rejeitado: incompatibilidade entre o código do ato e a tabela de preços acordada com a ' || payer_name || '.',
      'A codificação do ato não corresponde à convenção em vigor. Fatura ' || INVOICE_ID || ' devolvida para correção.')
    WHEN 2 THEN DECODE(tpl,
      0, 'O beneficiário não tem cobertura para o ato faturado no âmbito da apólice contratada. Processo ' || INVOICE_ID || ' recusado.',
      1, 'Fatura ' || INVOICE_ID || ': ato fora da cobertura do plano do segurado. Deverá ser cobrado diretamente ao cliente.',
      'Plafond da apólice esgotado para a especialidade de ' || LOWER(SPECIALTY) || '. Processo ' || INVOICE_ID || ' não comparticipado.')
    WHEN 3 THEN DECODE(tpl,
      0, 'O diagnóstico registado não justifica clinicamente o exame realizado. Solicitamos relatório clínico para reapreciação do processo ' || INVOICE_ID || '.',
      1, 'Processo ' || INVOICE_ID || ' devolvido: falta justificação clínica para o exame complementar faturado.',
      'Pedimos informação clínica adicional que fundamente o ato faturado na fatura ' || INVOICE_ID || '.')
    ELSE DECODE(tpl,
      0, 'O ato faturado no processo ' || INVOICE_ID || ' já tinha sido faturado anteriormente. Rejeitado por duplicação.',
      1, 'Duplicação detetada: a fatura ' || INVOICE_ID || ' repete um ato já liquidado.',
      'Processo ' || INVOICE_ID || ' recusado por se tratar de um ato duplicado.')
  END
FROM t;

-- ---------- SAP · daily stock and consumption for 40 critical materials (last 120 days) ----------
INSERT OVERWRITE INTO RAW.SAP_STOCK_DAILY
WITH m AS (SELECT column1 mid, column2 mname, column3 cat, column4 daily, column5 cost FROM VALUES
  ('M001','Contraste iodado 350','Imagiologia',38,24.5),('M002','Enoxaparina 40 mg','Fármacos',62,3.1),('M003','Stent farmacológico 3.0','Dispositivos',3,410),('M004','Propofol 1%','Fármacos',45,4.2),
  ('M005','Amoxicilina + ác. clavulânico IV','Fármacos',30,6.8),('M006','Prótese anca cimentada','Dispositivos',1.4,1850),('M007','Prótese joelho total','Dispositivos',1.6,2100),('M008','Luvas cirúrgicas 7,5','Material clínico',420,0.9),
  ('M009','Seringa 10 ml','Material clínico',900,0.08),('M010','Soro fisiológico 500 ml','Fármacos',380,0.7),('M011','Paracetamol IV 1 g','Fármacos',140,1.2),('M012','Ceftriaxona 1 g','Fármacos',48,2.9),
  ('M013','Cateter venoso 20G','Material clínico',260,0.6),('M014','Kit de sutura','Material clínico',90,4.5),('M015','Fio de sutura absorvível','Material clínico',160,2.2),('M016','Insulina rápida','Fármacos',25,9.4),
  ('M017','Heparina não fracionada','Fármacos',20,5.1),('M018','Midazolam 5 mg','Fármacos',35,1.9),('M019','Fentanil 0,05 mg/ml','Fármacos',40,2.4),('M020','Rocurónio 50 mg','Fármacos',22,7.8)),
h AS (SELECT HOSPITAL_ID, BEDS / 120.0 sc FROM REF.HOSPITALS),
d AS (SELECT CAL_DATE FROM REF.CALENDAR WHERE CAL_DATE BETWEEN '2026-07-15' AND '2026-11-11')
SELECT h.HOSPITAL_ID, m.mid, m.mname, m.cat, d.CAL_DATE,
  ROUND(m.daily * h.sc * (14 + 10 * COS(2 * PI() * DATEDIFF(day, '2026-07-15', d.CAL_DATE) / 21 + REF.U(h.HOSPITAL_ID || m.mid) * 6)
        - IFF(h.HOSPITAL_ID = 'H01' AND m.mid = 'M001', 0.7 * DATEDIFF(day, '2026-10-20', GREATEST(d.CAL_DATE, '2026-10-20')), 0))),
  ROUND(m.daily * h.sc * EXP(0.2 * REF.N(h.HOSPITAL_ID || m.mid || d.CAL_DATE))),
  ROUND(m.daily * h.sc * 6),
  m.cost,
  DATEADD(day, 30 + FLOOR(REF.U(h.HOSPITAL_ID || m.mid || 'exp') * 400), d.CAL_DATE)
FROM m CROSS JOIN h CROSS JOIN d;

-- ---------- UKG · rosters for the last 8 weeks (night shifts and overtime drive burnout risk) ----------
INSERT OVERWRITE INTO RAW.UKG_SHIFTS
WITH e AS (SELECT EMPLOYEE_ID, PAYLOAD:location::STRING hosp, PAYLOAD:nightShifts::BOOLEAN night, PAYLOAD:profileId::STRING prof FROM RAW.SF_EMPLOYEES),
d AS (SELECT CAL_DATE FROM REF.CALENDAR WHERE CAL_DATE BETWEEN '2026-09-17' AND '2026-11-11')
SELECT e.EMPLOYEE_ID || '-' || TO_CHAR(d.CAL_DATE, 'YYYYMMDD'), e.EMPLOYEE_ID, e.hosp, d.CAL_DATE,
  CASE WHEN e.night AND REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'n') < IFF(e.prof = 'joana', 0.42, 0.22) THEN 'Noite'
       WHEN REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 't') < 0.55 THEN 'Manhã' ELSE 'Tarde' END,
  IFF(REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'ot') < IFF(e.prof = 'joana', 0.25, 0.08), 12, 8),
  REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'ot') < IFF(e.prof = 'joana', 0.25, 0.08),
  ROUND(IFF(e.night, 9 + 8 * REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'rest'), 12 + 6 * REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'rest')), 1)
FROM e CROSS JOIN d
WHERE REF.U(e.EMPLOYEE_ID || d.CAL_DATE || 'work') < 0.66;

-- ---------- App MY LUZ · events (last 30 days) ----------
INSERT OVERWRITE INTO RAW.MYLUZ_EVENTS
WITH g AS (SELECT SEQ4() n FROM TABLE(GENERATOR(ROWCOUNT => 600000)))
SELECT 'EV-' || n, 'PT' || LPAD(1 + MOD(ABS(HASH(n, 'pt')), 400000), 7, '0'),
  DATEADD(second, -FLOOR(REF.U(n || 't') * 2592000), '2026-11-12 12:40:00'::TIMESTAMP_NTZ),
  OBJECT_CONSTRUCT('event', DECODE(MOD(ABS(HASH(n, 'e')), 10), 0,'consulta_resultados',1,'consulta_resultados',2,'consulta_resultados',3,'marcacao_consulta',4,'marcacao_consulta',5,'check_in',6,'check_in',7,'teleconsulta',8,'marcacao_exame','pagamento'),
                   'platform', IFF(REF.U(n || 'os') < 0.58, 'ios', 'android'), 'appVersion', '6.' || (2 + MOD(n, 3)) || '.0')
FROM g;
