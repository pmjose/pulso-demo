-- ==========================================================================================
-- 03a_seed_base.sql  ·  Calendar, districts, external signals, patient master, employees
-- Deterministic: every value comes from LUZSAUDE_DEMO.REF.U(key), a hash-based uniform, so
-- reruns produce identical data. Window: 12 Nov 2025 → 11 Nov 2026 ("today" = 12 Nov 2026).
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_LOAD_WH;
USE DATABASE LUZSAUDE_DEMO;

-- Deterministic uniform [0,1) and standard-normal helpers for synthetic data.
CREATE OR REPLACE FUNCTION REF.U(K STRING) RETURNS FLOAT
  AS $$ ((ABS(HASH(K)) % 1000003) / 1000003.0)::FLOAT $$;
CREATE OR REPLACE FUNCTION REF.N(K STRING) RETURNS FLOAT
  AS $$ (SQRT(-2 * LN(GREATEST(REF.U(K || '#a'), 1e-9))) * COS(2 * PI() * REF.U(K || '#b')))::FLOAT $$;
CREATE OR REPLACE FUNCTION REF.DEMO_TODAY() RETURNS DATE AS $$ '2026-11-12'::DATE $$;

-- ---------- Calendar (2025-2026) with Portuguese public holidays ----------
INSERT OVERWRITE INTO REF.CALENDAR
WITH d AS (SELECT DATEADD(day, SEQ4(), '2025-01-01'::DATE) AS dt FROM TABLE(GENERATOR(ROWCOUNT => 730)))
SELECT dt, YEAR(dt), MONTH(dt),
       DECODE(MONTH(dt),1,'jan',2,'fev',3,'mar',4,'abr',5,'mai',6,'jun',7,'jul',8,'ago',9,'set',10,'out',11,'nov','dez'),
       WEEKISO(dt), DAYOFWEEKISO(dt),
       DECODE(DAYOFWEEKISO(dt),1,'seg',2,'ter',3,'qua',4,'qui',5,'sex',6,'sáb','dom'),
       DAYOFWEEKISO(dt) >= 6,
       h.name IS NOT NULL, h.name
FROM d LEFT JOIN (SELECT column1::DATE hd, column2 name FROM VALUES
  ('2025-01-01','Ano Novo'),('2025-04-18','Sexta-feira Santa'),('2025-04-20','Páscoa'),('2025-04-25','Dia da Liberdade'),('2025-05-01','Dia do Trabalhador'),
  ('2025-06-10','Dia de Portugal'),('2025-06-19','Corpo de Deus'),('2025-08-15','Assunção'),('2025-10-05','Implantação da República'),('2025-11-01','Todos os Santos'),
  ('2025-12-01','Restauração da Independência'),('2025-12-08','Imaculada Conceição'),('2025-12-25','Natal'),
  ('2026-01-01','Ano Novo'),('2026-04-03','Sexta-feira Santa'),('2026-04-05','Páscoa'),('2026-04-25','Dia da Liberdade'),('2026-05-01','Dia do Trabalhador'),
  ('2026-06-04','Corpo de Deus'),('2026-06-10','Dia de Portugal'),('2026-08-15','Assunção'),('2026-10-05','Implantação da República'),('2026-11-01','Todos os Santos'),
  ('2026-12-01','Restauração da Independência'),('2026-12-08','Imaculada Conceição'),('2026-12-25','Natal')) h ON h.hd = d.dt;

-- ---------- Districts served, with the hospital each district maps to ----------
INSERT OVERWRITE INTO REF.DISTRICTS VALUES
 ('Lisboa','Lisboa',38.72,-9.14),('Setúbal','Sul',38.52,-8.89),('Porto','Norte',41.15,-8.61),('Braga','Norte',41.55,-8.42),
 ('Vila Real','Norte',41.30,-7.74),('Coimbra','Centro',40.21,-8.43),('Aveiro','Centro',40.64,-8.65),('Leiria','Centro',39.74,-8.81),
 ('Santarém','Centro',39.24,-8.69),('Madeira','Madeira',32.65,-16.91);

CREATE OR REPLACE TABLE REF.HOSPITAL_DISTRICT AS
SELECT HOSPITAL_ID,
  CASE WHEN SHORT_NAME IN ('HL Lisboa','HL Torres de Lisboa','HL Oeiras','Hospital do Mar') THEN 'Lisboa'
       WHEN SHORT_NAME = 'HL Setúbal' THEN 'Setúbal'
       WHEN SHORT_NAME IN ('HL Arrábida','HL Póvoa de Varzim') THEN 'Porto'
       WHEN SHORT_NAME = 'HL Guimarães' THEN 'Braga'
       WHEN SHORT_NAME = 'HL Vila Real' THEN 'Vila Real'
       WHEN SHORT_NAME IN ('HL Coimbra','HL Figueira da Foz') THEN 'Coimbra'
       WHEN SHORT_NAME = 'HL Aveiro' THEN 'Aveiro'
       WHEN SHORT_NAME = 'HL Leiria' THEN 'Leiria'
       WHEN SHORT_NAME = 'HL Santarém' THEN 'Santarém'
       ELSE 'Madeira' END AS DISTRICT
FROM REF.HOSPITALS;

-- ---------- External signals: weather (with the cold front of Fri 13 Nov 2026), wastewater, flu ----------
-- Winter seasonality; the window includes a 7-day forecast (12-18 Nov 2026) used as future exogenous data.
INSERT OVERWRITE INTO EXT.WEATHER_DAILY
SELECT d.DISTRICT, c.CAL_DATE,
  ROUND(base_min + 5.5 * COS(2 * PI() * (DAYOFYEAR(c.CAL_DATE) - 200) / 365) + 1.6 * REF.N(d.DISTRICT || c.CAL_DATE || 'tmin')
        - IFF(c.CAL_DATE BETWEEN '2026-11-13' AND '2026-11-15', 4.5, 0), 1) AS TEMP_MIN_C,
  ROUND(base_min + 9 + 6.5 * COS(2 * PI() * (DAYOFYEAR(c.CAL_DATE) - 200) / 365) + 2.0 * REF.N(d.DISTRICT || c.CAL_DATE || 'tmax'), 1) AS TEMP_MAX_C,
  ROUND(GREATEST(0, IFF(REF.U(d.DISTRICT || c.CAL_DATE || 'rain') < 0.30 + 0.25 * COS(2 * PI() * (DAYOFYEAR(c.CAL_DATE) - 15) / 365), 12 * REF.U(d.DISTRICT || c.CAL_DATE || 'mm'), 0)), 1),
  'IPMA'
FROM REF.CALENDAR c
CROSS JOIN (SELECT DISTRICT, DECODE(DISTRICT,'Madeira',14.5,'Vila Real',6.5,'Braga',8.5,'Porto',9.5,'Coimbra',9.0,'Aveiro',9.5,'Leiria',9.0,'Santarém',9.5,'Setúbal',10.5,10.5) base_min FROM REF.DISTRICTS) d
WHERE c.CAL_DATE BETWEEN '2025-11-01' AND '2026-11-18';

-- The cold front the portal plans for: Lisbon minimum drops 5 °C to 6 °C on Friday 13 Nov (IPMA forecast).
UPDATE EXT.WEATHER_DAILY SET TEMP_MIN_C = v.t
FROM (SELECT column1::DATE d, column2 t FROM VALUES ('2026-11-11', 11.4), ('2026-11-12', 11.0), ('2026-11-13', 6.0), ('2026-11-14', 6.6), ('2026-11-15', 7.8)) v
WHERE DISTRICT = 'Lisboa' AND OBS_DATE = v.d;

-- Wastewater respiratory index peaks in winter; it leads ER respiratory demand by ~9 days.
INSERT OVERWRITE INTO EXT.WASTEWATER_WEEKLY
SELECT r.REGION, w.WEEK_START,
  ROUND(GREATEST(5, 40 + 45 * POWER(GREATEST(0, COS(2 * PI() * (DAYOFYEAR(w.WEEK_START) - 20) / 365)), 2) + 6 * REF.N(r.REGION || w.WEEK_START || 'ww')
        + IFF(w.WEEK_START >= '2026-10-26', 18, 0)), 1), 'INSA'
FROM (SELECT DISTINCT DATE_TRUNC('week', CAL_DATE) WEEK_START FROM REF.CALENDAR WHERE CAL_DATE BETWEEN '2025-11-01' AND '2026-11-18') w
CROSS JOIN (SELECT DISTINCT REGION FROM REF.DISTRICTS) r;

INSERT OVERWRITE INTO EXT.FLU_INCIDENCE_WEEKLY
SELECT REGION, WEEK_START, ROUND(GREATEST(3, RESPIRATORY_VIRUS_INDEX * 0.9 + 4 * REF.N(REGION || WEEK_START || 'ili')), 1), 'INSA/DGS'
FROM EXT.WASTEWATER_WEEKLY;

INSERT OVERWRITE INTO EXT.AIR_QUALITY_DAILY
SELECT DISTRICT, OBS_DATE, ROUND(GREATEST(3, 11 + 5 * COS(2 * PI() * (DAYOFYEAR(OBS_DATE) - 10) / 365) + 4 * REF.N(DISTRICT || OBS_DATE || 'pm')), 1), 'APA QualAr'
FROM EXT.WEATHER_DAILY;

INSERT OVERWRITE INTO EXT.SEARCH_TRENDS_WEEKLY
SELECT t.TERM, w.REGION, w.WEEK_START, ROUND(GREATEST(5, w.RESPIRATORY_VIRUS_INDEX * t.k + 6 * REF.N(t.TERM || w.REGION || w.WEEK_START)), 1), 'Google Trends'
FROM EXT.WASTEWATER_WEEKLY w CROSS JOIN (SELECT 'gripe' TERM, 1.0 k UNION ALL SELECT 'febre', 0.8 UNION ALL SELECT 'tosse', 0.7) t;

-- ---------- Patient master: 400 000 patients; the 240 portal profiles are the first ids ----------
CREATE OR REPLACE TEMPORARY TABLE REF._NAMES AS
SELECT 'F' sex, value::STRING nm, index i FROM TABLE(FLATTEN(PARSE_JSON('["Maria","Ana","Joana","Inês","Sofia","Beatriz","Mariana","Catarina","Rita","Teresa","Helena","Isabel","Paula","Cristina","Margarida","Filipa","Raquel","Patrícia","Sandra","Luísa","Graça","Fernanda","Rosa","Lúcia","Marta","Carla","Susana","Vera","Diana","Cláudia"]')))
UNION ALL
SELECT 'M', value::STRING, index FROM TABLE(FLATTEN(PARSE_JSON('["João","José","António","Manuel","Francisco","Pedro","Rui","Paulo","Luís","Miguel","Carlos","Jorge","Nuno","Tiago","André","Ricardo","Fernando","Joaquim","Vítor","Hugo","Bruno","Diogo","Duarte","Gonçalo","Afonso","Mário","Sérgio","Alberto","Armando","Henrique"]')));
CREATE OR REPLACE TEMPORARY TABLE REF._LAST AS
SELECT value::STRING ln, index i FROM TABLE(FLATTEN(PARSE_JSON('["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Martins","Jesus","Sousa","Fernandes","Gonçalves","Gomes","Lopes","Marques","Alves","Almeida","Ribeiro","Pinto","Carvalho","Teixeira","Moreira","Correia","Mendes","Nunes","Soares","Vieira","Monteiro","Cardoso","Rocha","Neves","Coelho","Cruz","Cunha","Pires","Ramos","Reis","Simões","Antunes","Matos"]')));

INSERT OVERWRITE INTO RAW.HIS_PATIENTS
WITH g AS (SELECT SEQ4() + 1 AS n FROM TABLE(GENERATOR(ROWCOUNT => 400000))),
prof AS (SELECT PROFILE_ID, FULL_NAME, SEX, AGE, HOSPITAL_ID, ROW_NUMBER() OVER (ORDER BY IS_FEATURED DESC, PROFILE_ID) n,
                CONSENT[0][1]::BOOLEAN c_research, CONSENT[1][1]::BOOLEAN c_comms FROM REF.PATIENT_PROFILES),
base AS (
  SELECT g.n, 'PT' || LPAD(g.n, 7, '0') AS patient_id,
    IFF(REF.U(g.n || 'sex') < 0.54, 'F', 'M') AS sex,
    LEAST(98, GREATEST(0, ROUND(44 + 22 * REF.N(g.n || 'age')))) AS age,
    REF.U(g.n || 'dist') AS ud, REF.U(g.n || 'pay') AS up
  FROM g)
SELECT b.patient_id, p.PROFILE_ID,
  COALESCE(p.FULL_NAME, fn.nm || ' ' || l1.ln || ' ' || l2.ln),
  COALESCE(p.SEX, b.sex),
  DATEADD(day, -FLOOR(REF.U(b.n || 'bd') * 360) - 2, DATEADD(year, -COALESCE(p.AGE, b.age), '2026-11-12'::DATE)),
  CASE WHEN b.ud < 0.36 THEN 'Lisboa' WHEN b.ud < 0.44 THEN 'Setúbal' WHEN b.ud < 0.59 THEN 'Porto' WHEN b.ud < 0.64 THEN 'Braga' WHEN b.ud < 0.67 THEN 'Vila Real'
       WHEN b.ud < 0.75 THEN 'Coimbra' WHEN b.ud < 0.80 THEN 'Aveiro' WHEN b.ud < 0.85 THEN 'Leiria' WHEN b.ud < 0.89 THEN 'Santarém' ELSE 'Madeira' END,
  -- payer mix follows revenue share: Multicare 31, Médis 14, AdvanceCare 9, Outras 6, ADSE 15, SNS 7, Particulares 18
  CASE WHEN b.up < 0.31 THEN 'P1' WHEN b.up < 0.45 THEN 'P2' WHEN b.up < 0.54 THEN 'P3' WHEN b.up < 0.60 THEN 'P4' WHEN b.up < 0.75 THEN 'P5' WHEN b.up < 0.82 THEN 'P6' ELSE 'P7' END,
  REF.U(b.n || 'prime') < 0.26,
  REF.U(b.n || 'app') < 0.70,
  LEAST(10, FLOOR(GREATEST(0, (COALESCE(p.AGE, b.age) - 40) / 12 + 1.2 * REF.N(b.n || 'ch')))),
  COALESCE(p.c_research, REF.U(b.n || 'cr') < 0.71),
  COALESCE(p.c_comms, REF.U(b.n || 'cc') < 0.85),
  DATEADD(day, -FLOOR(REF.U(b.n || 'since') * 3650), '2026-11-12'::TIMESTAMP_NTZ)
FROM base b
LEFT JOIN prof p ON p.n = b.n
JOIN REF._NAMES fn ON fn.sex = b.sex AND fn.i = MOD(ABS(HASH(b.n, 'fn')), 30)
JOIN REF._LAST l1 ON l1.i = MOD(ABS(HASH(b.n, 'l1')), 40)
JOIN REF._LAST l2 ON l2.i = MOD(ABS(HASH(b.n, 'l2')), 40);

-- ---------- Employees: 14 012 people (SuccessFactors OData payloads); profiles first ----------
INSERT OVERWRITE INTO RAW.SF_EMPLOYEES
WITH g AS (SELECT SEQ4() + 1 AS n FROM TABLE(GENERATOR(ROWCOUNT => 14012))),
h AS (SELECT HOSPITAL_ID, SHORT_NAME, BEDS, SUM(BEDS) OVER (ORDER BY HOSPITAL_ID) / SUM(BEDS) OVER () AS cum FROM REF.HOSPITALS),
prof AS (SELECT PROFILE_ID, FULL_NAME, ROLE_NAME, SERVICE, HOSPITAL_ID, RISKS[0][1]::FLOAT leave_risk, ROW_NUMBER() OVER (ORDER BY IS_FEATURED DESC, PROFILE_ID) n FROM REF.EMPLOYEE_PROFILES),
e AS (
  SELECT g.n, REF.U(g.n || 'hosp') uh, REF.U(g.n || 'role') ur, IFF(REF.U(g.n || 'sex') < 0.71, 'F', 'M') sex FROM g)
SELECT 'E' || LPAD(e.n, 6, '0'),
  OBJECT_CONSTRUCT(
    'userId', 'E' || LPAD(e.n, 6, '0'),
    'profileId', p.PROFILE_ID,
    'displayName', COALESCE(p.FULL_NAME, fn.nm || ' ' || l1.ln || ' ' || l2.ln),
    'gender', e.sex,
    'jobFamily', COALESCE(p.ROLE_NAME, CASE WHEN e.ur < 0.2935 THEN 'Médico(a)' WHEN e.ur < 0.5105 THEN 'Enfermeiro(a)' WHEN e.ur < 0.66 THEN 'Técnico(a) superior de saúde'
                                            WHEN e.ur < 0.83 THEN 'Assistente operacional' ELSE 'Administrativo(a)' END),
    'department', COALESCE(p.SERVICE, DECODE(MOD(ABS(HASH(e.n, 'svc')), 10), 0,'Cardiologia',1,'Ortopedia',2,'Oncologia',3,'Cirurgia Geral',4,'Obstetrícia',5,'Imagiologia',6,'Medicina Interna',7,'Pediatria',8,'Oftalmologia','Urgência')),
    'location', COALESCE(p.HOSPITAL_ID, (SELECT MIN(HOSPITAL_ID) FROM h WHERE h.cum >= e.uh)),
    'hireDate', DATEADD(day, -FLOOR(REF.U(e.n || 'hire') * 9000), '2026-11-12'::DATE),
    'contractType', IFF(REF.U(e.n || 'ct') < 0.82, 'Sem termo', 'A termo'),
    'performanceRating', ROUND(3.0 + 1.6 * REF.U(e.n || 'perf'), 1),
    'nightShifts', REF.U(e.n || 'night') < 0.46,
    'leaveRiskScore', COALESCE(p.leave_risk, ROUND(LEAST(0.9, GREATEST(0.02, 0.18 + 0.12 * REF.N(e.n || 'lr'))), 2))
  ),
  CURRENT_TIMESTAMP()::TIMESTAMP_NTZ
FROM e
LEFT JOIN prof p ON p.n = e.n
JOIN REF._NAMES fn ON fn.sex = e.sex AND fn.i = MOD(ABS(HASH(e.n, 'efn')), 30)
JOIN REF._LAST l1 ON l1.i = MOD(ABS(HASH(e.n, 'el1')), 40)
JOIN REF._LAST l2 ON l2.i = MOD(ABS(HASH(e.n, 'el2')), 40);
