# Luz Saúde · Plataforma de Dados e IA — Snowflake deployment

Everything the demo portal shows, built as real Snowflake objects: 400 000 patients, 14 012 employees, a year of clinical, financial and operational activity, Dynamic Tables, Horizon governance, 10 semantic views, Snowflake ML models, Cortex AI enrichment, Cortex Search, the **Luz IA** Cortex Agent, tasks and alerts.

**All data is fictitious.** It is generated deterministically and calibrated so that Snowflake reproduces the figures on the portal (see *Reconciliation* below).

## Deploy

Prerequisites:
- A Snowflake account with Cortex AI available in its region (built and tested on AWS eu-west-3, Paris).
- A user who can assume `ACCOUNTADMIN`.
- The Snowflake CLI (`snow`) with a connection to that account.

```bash
cd snowflake
./deploy.sh <your-snow-connection>      # ≈ 30 minutes on a fresh account
```

`deploy.sh` runs the scripts below in order and writes a log per script to `snowflake/logs/`. Every script is idempotent, so a rerun rebuilds cleanly.

| # | Script | What it creates |
|---|---|---|
| 00 | `00_setup.sql` | Roles `LUZ_ADMIN` (owner), `LUZ_CLINICO`, `LUZ_FINANCAS`, `LUZ_DIRECAO_HOSPITAL`, `LUZ_ANALISTA`, `LUZ_INVESTIGACAO`, `LUZ_APP`; warehouses `LUZ_LOAD_WH`, `LUZ_TRANSFORM_WH`, `LUZ_ML_WH`, `LUZ_APP_WH` (auto-suspend 60 s); database `LUZSAUDE_DEMO` with schemas `RAW`, `REF`, `EXT`, `CORE`, `SEMANTIC`, `ML`, `AI`, `GOV`, `OPS` |
| 01 | `01_tables.sql` | Reference tables (`REF`), landing tables shaped like the source systems (`RAW`: HL7 v2 ADT and FHIR R4 as VARIANT, CDC copies of the HIS and SAP, payer responses as text), external signals (`EXT`) |
| 02 | `02_reference_data.sql` | **Generated from the portal's own data files** by `gen/export-reference.mjs`: 15 hospitals with their targets, 24 clinics, 7 payers, operating rooms and today's plan, the 240 patient and 183 employee profiles, 19 models, 24 KPI definitions, the 2026 budget |
| 03a | `03a_seed_base.sql` | Calendar with Portuguese holidays, districts, IPMA weather (including the cold front of Fri 13 Nov), INSA wastewater and flu, air quality, search trends, 400 000 patients, 14 012 employees |
| 03b | `03b_seed_clinical.sql` | 837 k ER encounters (FHIR), 128 k admissions (HL7 ADT), 41 k surgeries, 3.8 M appointments, 180 k lab results |
| 03c | `03c_seed_business.sql` | 4.4 M invoices with payer responses, SAP stock, UKG rosters, MY LUZ events |
| 03d | `03d_seed_text.sql` | Source-system catalogue, 16 clinical protocols, 3 412 clinical notes, 9 000 NPS comments |
| 04 | `04_core_dynamic_tables.sql` | 13 Dynamic Tables: episodes, occupancy, surgeries, appointments, invoices, stock cover, workload, **Patient 360**, **Employee 360**, daily hospital KPIs |
| 05 | `05_governance.sql` | Classification tags, masking (diagnoses, notes, names, birth dates, HR scores), row access by hospital, consented research cohort |
| 06 | `06_semantic_views.sql` | `SV_OPERACOES`, `SV_URGENCIA`, `SV_INTERNAMENTOS`, `SV_BLOCO`, `SV_AMBULATORIO`, `SV_RECEITA`, `SV_FINANCAS`, `SV_QUALIDADE`, `SV_PESSOAS`, `SV_EXPERIENCIA` (Portuguese synonyms) |
| 07 | `07_ml.sql` | Forecasts (ER demand with weather and wastewater; revenue to year end), classifiers (no-show, payer rejection, 30-day readmission), anomaly detection (payer rejection rate), XGBoost surgery duration in the **Model Registry**, prediction tables |
| 08 | `08_ai.sql` | `AI_CLASSIFY` rejection reasons, `AI_EXTRACT` clinical risks with evidence, `AI_REDACT` research notes, `AI_SENTIMENT` by aspect, `AI_SUMMARIZE_AGG` complaint themes, `AI_COMPLETE` patient summaries, Cortex Search over protocols and notes |
| 09 | `09_agent.sql` | **Luz IA** Cortex Agent: 10 Cortex Analyst tools (one per semantic view) and protocol search, answering in Portuguese |
| 10 | `10_ops.sql` | Daily scoring task, hourly AI classification task, ER-surge and payer-anomaly alerts (all created **suspended**), alert log, data metric functions |
| 11 | `11_verify.sql` | `OPS.PORTAL_RECONCILIATION`: portal figure vs. Snowflake figure for 23 indicators |

## How it maps to the portal

| Portal page | Snowflake objects |
|---|---|
| Visão geral, Operações, Fluxo | `CORE.HOSPITAL_DAY_KPI`, `SV_OPERACOES`, `ML.ER_DEMAND_PREDICTIONS` |
| Bloco operatório | `CORE.SURGERY`, `REF.OR_*`, `SV_BLOCO`, Model Registry `SURGERY_DURATION` |
| Ambulatório | `CORE.APPOINTMENT`, `SV_AMBULATORIO`, `ML.NOSHOW_PREDICTIONS` |
| Receita e seguradoras, Variação | `CORE.INVOICE`, `SV_RECEITA`, `AI.REJECTION_REASONS_BY_PAYER`, `ML.REJECTION_PREDICTIONS`, `ML.REJECTION_ANOMALIES` |
| Finanças, Planeamento | `SV_FINANCAS`, `REF.PLAN_MONTHLY_2026`, `ML.REVENUE_CLOSE_2026` |
| Qualidade clínica | `SV_QUALIDADE`, `ML.READMISSION_PREDICTIONS` |
| Doente 360° | `CORE.PATIENT_360`, `AI.PATIENT_SUMMARIES`, `AI.CLINICAL_RISKS_TODAY` |
| Colaborador 360°, Pessoas | `CORE.EMPLOYEE_360`, `SV_PESSOAS` |
| Sinais externos | `EXT.*`, exogenous features in `ML.ER_DEMAND_FORECAST` |
| Notas clínicas IA | `AI.CLINICAL_NOTE_SIGNALS`, `AI.CLINICAL_NOTES_SEARCH` |
| Experiência do cliente | `SV_EXPERIENCIA`, `AI.FEEDBACK_SENTIMENT`, `AI.FEEDBACK_THEMES_WEEKLY` |
| Learning Health | `GOV.RESEARCH_INPATIENT_COHORT`, `AI.CLINICAL_NOTES_REDACTED` |
| Assistente Luz IA, copilot | Agent `AI.LUZ_IA` |
| Alertas | `OPS.ALERT_LOG`, alerts `OPS.A_*` |
| Dicionário de indicadores | `REF.KPI_DICTIONARY` |
| Arquitetura | `REF.SOURCE_SYSTEMS` (each source system with the `RAW` table it lands in) |

## The stories the data tells

The synthetic data carries the same signals the portal narrates, so the ML and AI layers find them on their own:

- **Cold front, Friday 13 Nov.** Lisbon's minimum drops to 6 °C. The ER forecast peaks that day, at 2 422 episodes for the group and 707 at HL Lisboa.
- **HL Lisboa occupancy rising.** It goes from about 86% to 91% in a week, and `SV_OPERACOES` and Luz IA both report it.
- **AdvanceCare rule change, 1 Nov.** Imaging now needs prior authorisation. Rejections rise from 3.1% to about 5%. `AI_CLASSIFY` attributes most of the new ones to "Autorização prévia em falta", and the anomaly detector flags AdvanceCare.
- **Sala 4 turnover.** It averages 34 minutes, against a 22-minute target.
- **2026 close.** It is forecast at about 874 M€ against an 868 M€ budget.

## Try it

```sql
USE ROLE LUZ_ADMIN; USE WAREHOUSE LUZ_APP_WH;
SELECT * FROM LUZSAUDE_DEMO.OPS.PORTAL_RECONCILIATION;
SELECT * FROM SEMANTIC_VIEW(LUZSAUDE_DEMO.SEMANTIC.SV_RECEITA
  DIMENSIONS financiadores.financiador METRICS faturas.taxa_rejeicao_pct WHERE faturas.data_servico >= '2026-11-01');
SELECT * FROM LUZSAUDE_DEMO.AI.REJECTION_REASONS_BY_PAYER WHERE PAYER = 'AdvanceCare';
-- Governance: run as a persona with secondary roles off
USE SECONDARY ROLES NONE; USE ROLE LUZ_FINANCAS;
SELECT DIAGNOSIS FROM LUZSAUDE_DEMO.CORE.INPATIENT_EPISODE LIMIT 3;   -- *** reservado (sigilo médico) ***
```

Luz IA can be opened in Snowsight under **AI & ML → Agents → LUZ_IA**.

## Cost and housekeeping

- **Idle cost is zero.** Warehouses auto-suspend after 60 s, and tasks and alerts are created suspended. Resume them only when needed, for example `ALTER TASK LUZSAUDE_DEMO.OPS.T_DAILY_SCORING RESUME;`.
- **AI functions run on a scoped set** to keep tokens low. Classification covers payer responses from the last 14 days, and sentiment scores each distinct comment once. The hourly task continues classification incrementally.
- **To remove everything:** `DROP DATABASE LUZSAUDE_DEMO;`, then drop the `LUZ_*` roles and warehouses.

## Notes and limits

- **Model scores.** The classifiers train on synthetic data. Their AUC (no-show ≈ 0.73, rejection ≈ 0.61, readmission ≈ 0.58) is honest for this data but below the illustrative figures on the portal's model cards. Real data would change both.
- **Regenerating reference data.** `02_reference_data.sql` is generated. Rerun `node snowflake/gen/export-reference.mjs` from the site folder after changing the portal's data files.
- **What is not built.** The integration layer (Openflow connectors, Snowpipe Streaming, Kafka, Clean Rooms, Marketplace listings) is represented by the `RAW` and `EXT` tables in their landing shape; wiring real sources is the next step of an implementation.
