#!/usr/bin/env bash
# Deploys the whole Luz Saúde demo platform in order. Usage:
#   ./deploy.sh <snow-connection-name> [first-script]   # e.g. ./deploy.sh MY_ACCOUNT_ADMIN
#   ./deploy.sh MY_ACCOUNT_ADMIN 08_ai.sql              # resume from a step after an interruption
# The connection's user must be able to use ACCOUNTADMIN (00_setup creates roles and grants).
# Every script is idempotent (CREATE OR REPLACE / INSERT OVERWRITE), so a rerun rebuilds cleanly.
set -euo pipefail
CONN="${1:?usage: ./deploy.sh <snow-connection-name> [first-script]}"
FROM="${2:-}"
cd "$(dirname "$0")"
mkdir -p logs
STEPS=(00_setup.sql 01_tables.sql 02_reference_data.sql 03a_seed_base.sql 03b_seed_clinical.sql 03c_seed_business.sql 03d_seed_text.sql
       04_core_dynamic_tables.sql 05_governance.sql 06_semantic_views.sql 07_ml.sql 08_ai.sql 09_agent.sql 10_ops.sql 11_verify.sql)
for f in "${STEPS[@]}"; do
  if [ -n "$FROM" ]; then [ "$f" = "$FROM" ] && FROM="" || continue; fi
  start=$(date +%s)
  printf '%-28s ' "$f"
  if snow sql -c "$CONN" -f "$f" > "logs/${f%.sql}.log" 2>&1; then
    echo "ok   $(( $(date +%s) - start ))s"
  else
    echo "FAILED — see logs/${f%.sql}.log"; exit 1
  fi
done
echo "Done. Reconciliation report: logs/11_verify.log"
