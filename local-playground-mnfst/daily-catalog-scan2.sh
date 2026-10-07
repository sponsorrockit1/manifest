#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
ADMIN_KEY=$(grep -o 'ADMIN_KEY=.*' mnfst_admin_ai_key.txt | cut -d= -f2-)
B=http://100.84.145.125:62400
for A in cron-probe hermes-orch hermes-coder; do
  code=$(curl -s -o /tmp/cat_$A.json -w '%{http_code}' "$B/api/v1/routing/$A/available-models" -H "x-api-key: $ADMIN_KEY")
  echo "$A get_http=$code bytes=$(wc -c </tmp/cat_$A.json)"
done
python3 - <<'PY'
import re,glob
for f in sorted(glob.glob('/tmp/cat_*.json')):
    s=open(f).read()
    ids=sorted(set(re.findall(r'"(?:id|model)"\s*:\s*"([^"]+)"',s)))
    free=[i for i in ids if 'free' in i.lower()]
    print(f.split('/')[-1],'ids',len(ids),'free',free if free else s[:160])
PY
echo scan2_end
