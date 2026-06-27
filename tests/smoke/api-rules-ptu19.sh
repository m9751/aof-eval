#!/usr/bin/env bash
# Smoke: /api/rules returns non-zero PTU-19 30d count (HEAD-count path, not 1000-row cap).
set -euo pipefail

BASE_URL="${1:-https://aof-eval.vercel.app}"
MIN_30D="${PTU19_MIN_30D:-1000}"

json="$(curl -fsS "${BASE_URL}/api/rules")"
n30="$(echo "$json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data.get('rules', []):
    if r.get('rule_id') == 'PTU-19':
        for w in r.get('windows', []):
            if w.get('days') == 30:
                print(w.get('n', 0))
                break
        break
else:
    print(0)
")"

if [[ -z "$n30" ]] || [[ "$n30" -lt "$MIN_30D" ]]; then
  echo "FAIL: PTU-19 30d n=${n30:-missing} (expected >= ${MIN_30D}) at ${BASE_URL}/api/rules"
  exit 1
fi

# Filtered query should match full-list count for the same rule.
filtered="$(curl -fsS "${BASE_URL}/api/rules?rule_id=PTU-19")"
n30f="$(echo "$filtered" | python3 -c "
import json, sys
data = json.load(sys.stdin)
rules = data.get('rules', [])
if len(rules) != 1 or rules[0].get('rule_id') != 'PTU-19':
    print(-1)
    sys.exit(0)
for w in rules[0].get('windows', []):
    if w.get('days') == 30:
        print(w.get('n', 0))
        break
")"

if [[ "$n30f" != "$n30" ]]; then
  echo "FAIL: rule_id filter mismatch full=${n30} filtered=${n30f}"
  exit 1
fi

echo "PASS: PTU-19 30d n=${n30}; rule_id filter OK (${BASE_URL})"