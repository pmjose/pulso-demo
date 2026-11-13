-- ==========================================================================================
-- 03b_seed_clinical.sql  ·  ER encounters (FHIR), admissions (HL7 ADT), surgeries, appointments,
-- lab results, clinical notes and patient feedback. Calibrated to REF.HOSPITALS targets.
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_LOAD_WH;
USE DATABASE LUZSAUDE_DEMO;

-- Number helper (0..2999) used to explode daily counts into rows.
CREATE OR REPLACE TABLE REF._NUMS AS SELECT SEQ4() AS I FROM TABLE(GENERATOR(ROWCOUNT => 3000));

-- Hourly ER arrival profile (morning and evening peaks) as cumulative weights.
CREATE OR REPLACE TABLE REF._ER_HOURS AS
WITH w AS (SELECT SEQ4() h, 14 + 30 * EXP(-POWER(SEQ4() - 11, 2) / 18) + 26 * EXP(-POWER(SEQ4() - 20, 2) / 10) wt FROM TABLE(GENERATOR(ROWCOUNT => 24)))
SELECT h, SUM(wt) OVER (ORDER BY h) / SUM(wt) OVER () AS cum_hi, (SUM(wt) OVER (ORDER BY h) - wt) / SUM(wt) OVER () AS cum_lo FROM w;

-- Daily drivers per hospital: winter seasonality, weekday pattern, respiratory wave (wastewater, 9-day lead).
CREATE OR REPLACE TABLE REF._HOSPITAL_DAY AS
SELECT h.HOSPITAL_ID, c.CAL_DATE, c.WEEKDAY, c.IS_HOLIDAY,
  h.TARGET_ER_VISITS_DAY, h.TARGET_ADMISSIONS_DAY, h.TARGET_OCC_PCT, h.BEDS, h.TARGET_ER_WAIT_MIN,
  COALESCE(ww.RESPIRATORY_VIRUS_INDEX, 50) AS resp_index,
  (1 + 0.10 * COS(2 * PI() * (DAYOFYEAR(c.CAL_DATE) - 15) / 365))
  * DECODE(c.WEEKDAY, 1, 1.12, 2, 1.03, 3, 1.0, 4, 0.99, 5, 1.02, 6, 0.92, 0.90)
  * (0.90 + COALESCE(ww.RESPIRATORY_VIRUS_INDEX, 50) / 500)
  * (1 + 0.06 * REF.N(h.HOSPITAL_ID || c.CAL_DATE || 'er')) AS er_factor
FROM REF.HOSPITALS h
JOIN REF.HOSPITAL_DISTRICT hd ON hd.HOSPITAL_ID = h.HOSPITAL_ID
JOIN REF.DISTRICTS d ON d.DISTRICT = hd.DISTRICT
CROSS JOIN REF.CALENDAR c
LEFT JOIN EXT.WASTEWATER_WEEKLY ww ON ww.REGION = d.REGION AND ww.WEEK_START = DATE_TRUNC('week', DATEADD(day, -9, c.CAL_DATE))
WHERE c.CAL_DATE BETWEEN '2025-11-12' AND '2026-11-11';

-- ---------- Urgência · FHIR R4 Encounter ----------
INSERT OVERWRITE INTO RAW.HIS_ER_ENCOUNTER_FHIR
WITH e AS (
  SELECT d.HOSPITAL_ID, d.CAL_DATE, n.I, d.TARGET_ER_WAIT_MIN, d.resp_index,
    d.HOSPITAL_ID || '-' || TO_CHAR(d.CAL_DATE, 'YYYYMMDD') || '-' || n.I AS k
  FROM REF._HOSPITAL_DAY d JOIN REF._NUMS n ON n.I < ROUND(d.TARGET_ER_VISITS_DAY * d.er_factor)
), t AS (
  SELECT e.*, REF.U(k || 'tri') ut, REF.U(k || 'hr') uh, REF.U(k || 'resp') ur, REF.U(k || 'adm') ua,
    'PT' || LPAD(1 + MOD(ABS(HASH(k, 'pt')), 400000), 7, '0') pid
  FROM e
), x AS (
  SELECT t.*, hr.h AS arr_hour,
    CASE WHEN ut < 0.006 THEN 'Vermelho' WHEN ut < 0.080 THEN 'Laranja' WHEN ut < 0.398 THEN 'Amarelo' WHEN ut < 0.919 THEN 'Verde' ELSE 'Azul' END AS triage,
    ur < (0.10 + resp_index / 400) AS is_resp
  FROM t JOIN REF._ER_HOURS hr ON t.uh >= hr.cum_lo AND t.uh < hr.cum_hi
), y AS (
  SELECT x.*,
    DATEADD(minute, FLOOR(REF.U(k || 'min') * 60), DATEADD(hour, arr_hour, CAL_DATE::TIMESTAMP_NTZ)) AS arrived_at,
    ROUND(GREATEST(0, DECODE(triage, 'Vermelho', 0, 'Laranja', 7, 'Amarelo', 38, 'Verde', 52, 64)
          * (TARGET_ER_WAIT_MIN / 43.1) * (0.8 + 0.4 * IFF(arr_hour BETWEEN 18 AND 22, 1, 0)) * EXP(0.35 * REF.N(k || 'wait')))) AS wait_min,
    ua < DECODE(triage, 'Vermelho', 0.62, 'Laranja', 0.34, 'Amarelo', 0.12, 'Verde', 0.025, 0.005) AS admitted
  FROM x
)
SELECT 'ENC-' || k, DATEADD(minute, 1, arrived_at),
  OBJECT_CONSTRUCT(
    'resourceType', 'Encounter', 'id', 'ENC-' || k, 'status', 'finished',
    'class', OBJECT_CONSTRUCT('system', 'http://terminology.hl7.org/CodeSystem/v3-ActCode', 'code', 'EMER'),
    'priority', OBJECT_CONSTRUCT('coding', ARRAY_CONSTRUCT(OBJECT_CONSTRUCT('system', 'urn:pt:triagem-manchester', 'code', triage))),
    'subject', OBJECT_CONSTRUCT('reference', 'Patient/' || pid),
    'serviceProvider', OBJECT_CONSTRUCT('reference', 'Organization/' || HOSPITAL_ID),
    'period', OBJECT_CONSTRUCT('start', TO_CHAR(arrived_at, 'YYYY-MM-DD"T"HH24:MI:SS'),
                               'end', TO_CHAR(DATEADD(minute, wait_min + 60 + FLOOR(180 * REF.U(k || 'los')), arrived_at), 'YYYY-MM-DD"T"HH24:MI:SS')),
    'reasonCode', ARRAY_CONSTRUCT(OBJECT_CONSTRUCT('text', IFF(is_resp, 'Respiratória',
        DECODE(MOD(ABS(HASH(k, 'rsn')), 6), 0, 'Trauma', 1, 'Dor abdominal', 2, 'Dor torácica', 3, 'Neurológica', 4, 'Febre', 'Outros')))),
    'extension', ARRAY_CONSTRUCT(OBJECT_CONSTRUCT('url', 'urn:luz:first-physician-minutes', 'valueInteger', wait_min)),
    'hospitalization', OBJECT_CONSTRUCT('dischargeDisposition', OBJECT_CONSTRUCT('text', IFF(admitted, 'Internamento', 'Alta')))
  )
FROM y;

-- ---------- Internamento · HL7 v2 ADT (A01 admit + A03 discharge) as JSON ----------
-- Length of stay is set so that occupancy matches each hospital's target (occ × beds ÷ admissions).
-- A pool of 25 000 chronic patients produces the ~6-7% readmissions within 30 days.
CREATE OR REPLACE TEMPORARY TABLE REF._ADM AS
WITH a AS (
  SELECT d.HOSPITAL_ID, d.CAL_DATE, n.I, d.HOSPITAL_ID || '-' || TO_CHAR(d.CAL_DATE, 'YYYYMMDD') || '-A' || n.I AS k,
    d.TARGET_OCC_PCT / 100 * d.BEDS / NULLIF(d.TARGET_ADMISSIONS_DAY, 0) AS mean_los
  FROM REF._HOSPITAL_DAY d JOIN REF._NUMS n ON n.I < ROUND(d.TARGET_ADMISSIONS_DAY * d.er_factor * DECODE(d.WEEKDAY, 6, 0.75, 7, 0.65, 1.08))
)
SELECT a.*,
  IFF(REF.U(k || 'chronic') < 0.29, 'PT' || LPAD(1 + MOD(ABS(HASH(k, 'cp')), 25000), 7, '0'), 'PT' || LPAD(1 + MOD(ABS(HASH(k, 'pt')), 400000), 7, '0')) AS pid,
  DATEADD(minute, FLOOR(REF.U(k || 'am') * 1440), a.CAL_DATE::TIMESTAMP_NTZ) AS admit_ts,
  GREATEST(0.3, a.mean_los * EXP(0.55 * REF.N(k || 'los') - 0.115) * IFF(a.HOSPITAL_ID = 'H01', IFF(a.CAL_DATE >= '2026-11-02', 0.995, 0.955), 1.0)) AS los_days,
  DECODE(MOD(ABS(HASH(k, 'spec')), 10), 0,'Cardiologia',1,'Ortopedia',2,'Oncologia',3,'Cirurgia Geral',4,'Obstetrícia',5,'Medicina Interna',6,'Medicina Interna',7,'Pediatria',8,'Cirurgia Geral','Medicina Interna') AS specialty,
  DECODE(MOD(ABS(HASH(k, 'dx')), 12), 0,'J18.9|Pneumonia',1,'I50.9|Insuficiência cardíaca',2,'E11.9|Diabetes tipo 2 descompensada',3,'S72.0|Fratura do colo do fémur',
         4,'K80.2|Litíase vesicular',5,'I21.9|Enfarte agudo do miocárdio',6,'N39.0|Infeção urinária',7,'O80|Parto',8,'C50.9|Neoplasia da mama',9,'M17.1|Gonartrose',10,'J44.1|DPOC agudizada','A41.9|Sépsis') AS dx
FROM a;

INSERT OVERWRITE INTO RAW.HIS_ADT_HL7
SELECT 'MSG-' || k || '-A01', 'ADT^A01', DATEADD(second, 20, admit_ts), 'HIS',
  OBJECT_CONSTRUCT('MSH', OBJECT_CONSTRUCT('9', 'ADT^A01', '7', TO_CHAR(admit_ts, 'YYYYMMDDHH24MISS')),
    'PID', OBJECT_CONSTRUCT('3', pid),
    'PV1', OBJECT_CONSTRUCT('2', 'I', '3', OBJECT_CONSTRUCT('4', HOSPITAL_ID), '10', specialty, '19', 'EP-' || k, '44', TO_CHAR(admit_ts, 'YYYYMMDDHH24MISS')),
    'DG1', OBJECT_CONSTRUCT('3', OBJECT_CONSTRUCT('1', SPLIT_PART(dx, '|', 1), '2', SPLIT_PART(dx, '|', 2)))) FROM REF._ADM
UNION ALL
SELECT 'MSG-' || k || '-A03', 'ADT^A03', DATEADD(minute, ROUND(los_days * 1440) + 1, admit_ts), 'HIS',
  OBJECT_CONSTRUCT('MSH', OBJECT_CONSTRUCT('9', 'ADT^A03', '7', TO_CHAR(DATEADD(minute, ROUND(los_days * 1440), admit_ts), 'YYYYMMDDHH24MISS')),
    'PID', OBJECT_CONSTRUCT('3', pid),
    'PV1', OBJECT_CONSTRUCT('2', 'I', '3', OBJECT_CONSTRUCT('4', HOSPITAL_ID), '10', specialty, '19', 'EP-' || k,
      '44', TO_CHAR(admit_ts, 'YYYYMMDDHH24MISS'), '45', TO_CHAR(DATEADD(minute, ROUND(los_days * 1440), admit_ts), 'YYYYMMDDHH24MISS'),
      '36', IFF(REF.U(k || 'disp') < 0.06, 'Transferência', 'Domicílio')),
    'DG1', OBJECT_CONSTRUCT('3', OBJECT_CONSTRUCT('1', SPLIT_PART(dx, '|', 1), '2', SPLIT_PART(dx, '|', 2)))) FROM REF._ADM
WHERE DATEADD(minute, ROUND(los_days * 1440), admit_ts) < '2026-11-12 12:40:00'::TIMESTAMP_NTZ;

-- ---------- Bloco operatório · surgical log (~41 000 surgeries a year) ----------
-- HL Lisboa uses its 10 named rooms (Sala 4 has the slow 34-min turnover); other hospitals get generic rooms.
INSERT OVERWRITE INTO RAW.HIS_SURGERY_LOG
WITH proc AS (SELECT column1 sp, column2 pname, column3 est, column4 robotic FROM VALUES
  ('Ortopedia','Artroplastia total do joelho',100,FALSE),('Ortopedia','Artroplastia total do joelho (robótica)',105,TRUE),('Ortopedia','Artroplastia total da anca',110,FALSE),('Ortopedia','Artroscopia do joelho',55,FALSE),
  ('Cirurgia Geral','Colecistectomia laparoscópica',75,FALSE),('Cirurgia Geral','Hernioplastia inguinal',60,FALSE),('Cirurgia Geral','Gastrectomia parcial',180,FALSE),
  ('Urologia','Prostatectomia radical (robótica)',180,TRUE),('Urologia','Ureteroscopia',50,FALSE),('Oftalmologia','Facoemulsificação (catarata)',22,FALSE),('Oftalmologia','Vitrectomia',70,FALSE),
  ('Cirurgia Cardiotorácica','Bypass coronário',240,FALSE),('Ginecologia','Histerectomia laparoscópica',90,FALSE),('Otorrinolaringologia','Septoplastia e turbinoplastia',65,FALSE),('Cirurgia Plástica','Reconstrução mamária',150,FALSE)),
p AS (SELECT ROW_NUMBER() OVER (ORDER BY pname) - 1 pi, * FROM proc),
s AS (
  SELECT d.HOSPITAL_ID, d.CAL_DATE, n.I, d.HOSPITAL_ID || '-' || TO_CHAR(d.CAL_DATE, 'YYYYMMDD') || '-S' || n.I AS k
  FROM REF._HOSPITAL_DAY d JOIN REF.HOSPITALS h ON h.HOSPITAL_ID = d.HOSPITAL_ID
  JOIN REF._NUMS n ON n.I < ROUND(h.BEDS * 0.089 * IFF(d.WEEKDAY >= 6, 0.15, 1.0) * IFF(d.IS_HOLIDAY, 0.1, 1.0) * IFF(MONTH(d.CAL_DATE) = 8, 0.8, 1.0))
  WHERE h.SHORT_NAME <> 'Hospital do Mar'
)
SELECT 'CX-' || s.k, s.HOSPITAL_ID,
  IFF(s.HOSPITAL_ID = 'H01', r.ROOM_ID, s.HOSPITAL_ID || '-OR0' || (1 + MOD(s.I, 4))),
  p.sp, p.pname,
  IFF(s.HOSPITAL_ID = 'H01' AND r.SPECIALTY IS NOT NULL AND REF.U(s.k || 'surg') < 0.4, 'Dr. Ricardo Alves',
      DECODE(MOD(ABS(HASH(s.k, 'sg')), 8), 0,'Dr. Rui Pinto',1,'Dr. Tomás Vieira',2,'Dr. Henrique Sá',3,'Dra. Inês Cardoso',4,'Dr. Miguel Antunes',5,'Dra. Paula Reis',6,'Dr. Luís Faria','Dr. Ricardo Alves')),
  'PT' || LPAD(1 + MOD(ABS(HASH(s.k, 'pt')), 400000), 7, '0'),
  'P' || (1 + MOD(ABS(HASH(s.k, 'pay')), 7)),
  1 + FLOOR(REF.U(s.k || 'asa') * 3.2), 30 + FLOOR(REF.U(s.k || 'age') * 55),
  s.CAL_DATE,
  DATEADD(minute, 480 + 125 * MOD(s.I, 5), s.CAL_DATE::TIMESTAMP_NTZ),
  p.est,
  DATEADD(minute, 480 + 125 * MOD(s.I, 5) + IFF(MOD(s.I, 5) = 0, ROUND(GREATEST(0, 12 + 9 * REF.N(s.k || 'fc'))), ROUND(GREATEST(0, 6 * REF.N(s.k || 'st')))), s.CAL_DATE::TIMESTAMP_NTZ),
  ROUND(p.est * EXP(0.09 + 0.16 * REF.N(s.k || 'dur'))),
  ROUND(GREATEST(9, COALESCE(r.TURNOVER_MIN, 23) + 4 * REF.N(s.k || 'to'))),
  p.robotic,
  REF.U(s.k || 'cxl') < 0.047,
  CASE WHEN REF.U(s.k || 'cxl') < 0.047 THEN
    CASE WHEN REF.U(s.k || 'why') < 0.31 THEN 'Doente não apto (pré-operatório)' WHEN REF.U(s.k || 'why') < 0.53 THEN 'Falta de cama de internamento'
         WHEN REF.U(s.k || 'why') < 0.71 THEN 'Atraso da cirurgia anterior' WHEN REF.U(s.k || 'why') < 0.85 THEN 'Doente faltou'
         WHEN REF.U(s.k || 'why') < 0.94 THEN 'Material/equipamento' ELSE 'Outros' END END,
  REF.U(s.k || 'icu') < IFF(p.est >= 180, 0.35, 0.03),
  DATEADD(hour, 20, s.CAL_DATE::TIMESTAMP_NTZ)
FROM s
JOIN p ON p.pi = MOD(ABS(HASH(s.k, 'proc')), 15)
LEFT JOIN REF.OR_ROOMS r ON s.HOSPITAL_ID = 'H01' AND r.ROOM_ID = 'H01-OR' || LPAD(1 + MOD(ABS(HASH(s.k, 'room')), 9), 2, '0');

-- ---------- Consultas · appointments for hospitals and clinics (incl. the next 7 days, scheduled) ----------
-- No-shows follow a logistic model of lead time, history, distance, rain, app confirmation and hour;
-- reminders by AI from May 2026 lower the rate by ~1.4 p.p., matching the portal.
INSERT OVERWRITE INTO RAW.HIS_APPOINTMENTS
WITH units AS (
  SELECT HOSPITAL_ID unit_id, 'Hospital' unit_type, TARGET_CONSULTS_MONTH m, TARGET_NOSHOW_PCT ns, TARGET_TELE_PCT tele, hd.DISTRICT FROM REF.HOSPITALS h JOIN REF.HOSPITAL_DISTRICT hd USING (HOSPITAL_ID)
  UNION ALL
  SELECT CLINIC_ID, 'Clínica', TARGET_CONSULTS_MONTH, TARGET_NOSHOW_PCT, TARGET_TELE_PCT, DECODE(REGION,'Norte','Porto','Centro','Coimbra','Sul','Setúbal','Madeira','Madeira','Lisboa') FROM REF.CLINICS
), days AS (SELECT CAL_DATE, WEEKDAY, IS_HOLIDAY FROM REF.CALENDAR WHERE CAL_DATE BETWEEN '2025-11-12' AND '2026-11-18' AND WEEKDAY <= 6 AND NOT IS_HOLIDAY),
a AS (
  SELECT u.*, d.CAL_DATE, d.WEEKDAY, n.I, u.unit_id || '-' || TO_CHAR(d.CAL_DATE, 'YYYYMMDD') || '-C' || n.I AS k
  FROM units u CROSS JOIN days d JOIN REF._NUMS n ON n.I < ROUND(u.m / 22.6 * IFF(d.WEEKDAY = 6, 0.3, 1.0) * (1 + 0.04 * REF.N(u.unit_id || d.CAL_DATE)))
), f AS (
  SELECT a.*,
    FLOOR(3 + 90 * POWER(REF.U(k || 'lead'), 1.6)) lead_days,
    REF.U(k || 'tele') < tele / 100 is_tele,
    REF.U(k || 'first') < 0.30 is_first,
    REF.U(k || 'conf') < 0.62 confirmed,
    ROUND(1.5 + 45 * POWER(REF.U(k || 'dist'), 2.2), 1) distance_km,
    8 + FLOOR(REF.U(k || 'hh') * 10) hh,
    CASE WHEN REF.U(k || 'ch') < 0.41 THEN 'App MY LUZ' WHEN REF.U(k || 'ch') < 0.68 THEN 'Telefone (Linha Luz)' WHEN REF.U(k || 'ch') < 0.82 THEN 'Website'
         WHEN REF.U(k || 'ch') < 0.93 THEN 'Balcão' ELSE 'LUZ 24 · Digital' END channel,
    DECODE(MOD(ABS(HASH(k, 'sp')), 10), 0,'Cardiologia',1,'Ortopedia',2,'Oncologia',3,'Cirurgia Geral',4,'Obstetrícia',5,'Imagiologia',6,'Medicina Interna',7,'Pediatria',8,'Oftalmologia','Medicina Física e Reabilitação') spec
  FROM a
)
SELECT 'AP-' || k, unit_id, unit_type, spec,
  'PT' || LPAD(1 + MOD(ABS(HASH(k, 'pt')), 400000), 7, '0'),
  'P' || (1 + MOD(ABS(HASH(k, 'pay')), 7)),
  DATEADD(day, -lead_days, CAL_DATE::TIMESTAMP_NTZ),
  DATEADD(minute, hh * 60 + 15 * MOD(I, 4), CAL_DATE::TIMESTAMP_NTZ),
  channel, is_tele, is_first, confirmed, distance_km, w.PRECIP_MM > 3,
  CASE WHEN CAL_DATE >= '2026-11-12' THEN 'Marcada'
       WHEN REF.U(k || 'ns') < 1 / (1 + EXP(-(-2.93 + LN(ns / 8.4) + 0.012 * lead_days + 0.9 * IFF(is_first, 1, 0) - 1.1 * IFF(confirmed, 1, 0)
                                             + 0.018 * distance_km + 0.45 * IFF(w.PRECIP_MM > 3, 1, 0) + 0.25 * IFF(hh >= 15, 1, 0) - 0.6 * IFF(is_tele, 1, 0)
                                             - IFF(CAL_DATE >= '2026-05-01', 0.19, 0)))) THEN 'Falta'
       ELSE 'Realizada' END,
  'I', DATEADD(minute, 5, CAL_DATE::TIMESTAMP_NTZ)
FROM f LEFT JOIN EXT.WEATHER_DAILY w ON w.DISTRICT = f.DISTRICT AND w.OBS_DATE = f.CAL_DATE;

-- ---------- Laboratório · LOINC-coded results for chronic patients and the profiled patients ----------
INSERT OVERWRITE INTO RAW.LIS_RESULTS
WITH g AS (SELECT SEQ4() n FROM TABLE(GENERATOR(ROWCOUNT => 180000))),
t AS (SELECT column1 loinc, column2 test, column3 unit, column4 mu, column5 sd FROM VALUES
  ('4548-4','HbA1c',' %',7.1,1.1),('2345-7','Glicose',' mg/dL',118,30),('2160-0','Creatinina',' mg/dL',1.05,0.35),('33762-6','NT-proBNP',' pg/mL',650,700),
  ('1988-5','Proteína C reativa',' mg/L',12,18),('2093-3','Colesterol total',' mg/dL',195,38),('718-7','Hemoglobina',' g/dL',13.2,1.6),('2524-7','Lactato',' mmol/L',1.4,0.8)),
tt AS (SELECT ROW_NUMBER() OVER (ORDER BY loinc) - 1 ti, * FROM t)
SELECT 'LAB-' || g.n, 'PT' || LPAD(1 + MOD(ABS(HASH(g.n, 'pt')), 25000), 7, '0'),
  'H' || LPAD(1 + MOD(ABS(HASH(g.n, 'h')), 15), 2, '0'), tt.loinc, tt.test,
  ROUND(GREATEST(0.1, tt.mu + tt.sd * REF.N(g.n || 'v')), 2), TRIM(tt.unit),
  DATEADD(minute, -FLOOR(REF.U(g.n || 't') * 525600), '2026-11-12 08:00:00'::TIMESTAMP_NTZ),
  OBJECT_CONSTRUCT('OBX', OBJECT_CONSTRUCT('3', tt.loinc, '5', ROUND(GREATEST(0.1, tt.mu + tt.sd * REF.N(g.n || 'v')), 2), '6', TRIM(tt.unit)))
FROM g JOIN tt ON tt.ti = MOD(ABS(HASH(g.n, 'test')), 8);

-- The featured patient's HbA1c trend (7,1% → 7,4% → 7,8%), as on her Doente 360° page.
DELETE FROM RAW.LIS_RESULTS WHERE PATIENT_ID = 'PT0000001' AND LOINC_CODE = '4548-4';
INSERT INTO RAW.LIS_RESULTS
SELECT 'LAB-ANA-' || column1, 'PT0000001', 'H01', '4548-4', 'HbA1c', column2, '%', column3::TIMESTAMP_NTZ,
       OBJECT_CONSTRUCT('OBX', OBJECT_CONSTRUCT('3', '4548-4', '5', column2, '6', '%'))
FROM VALUES (1, 7.1, '2026-02-10 08:30:00'), (2, 7.4, '2026-06-02 08:15:00'), (3, 7.8, '2026-09-29 08:40:00');

