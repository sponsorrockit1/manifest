#!/usr/bin/env bash
# Daily free-model catalog scan + agent error monitoring (no key values printed)
cd "$(dirname "$0")" || exit 1
ADMIN_KEY=$(grep -o 'ADMIN_KEY=.*' mnfst_admin_ai_key.txt | cut -d= -f2-)
PROBE_KEY=$(grep -o 'PROBE_KEY=.*' mnfst_probe_agent_key.txt | cut -d= -f2-)
B=http://100.84.145.125:62400

echo "post_http=$(curl -s -o /tmp/post.json -w '%{http_code}' -X POST "$B/api/v1/routing/cron-probe/available-models" -H "x-api-key: $PROBE_KEY")"
sleep 5
echo "get_http=$(curl -s -o /tmp/cat.json -w '%{http_code}' "$B/api/v1/routing/cron-probe/available-models" -H "x-api-key: $PROBE_KEY")"
python3 - <<'PY'
import re
try:
    s=open('/tmp/cat.json').read()
except Exception as e:
    print('cat_read_err',e); raise SystemExit
ids=sorted(set(re.findall(r'"(?:id|model|name)"\s*:\s*"([^"]+)"',s)))
print('catalog_ids',len(ids))
free=[i for i in ids if 'free' in i.lower()]
print('FREE_MODELS:',free)
print('ALL_IDS:',ids[:200])
PY
echo "usage_http=$(curl -s -o /tmp/usage.json -w '%{http_code}' "$B/api/v1/admin/observability/usage" -H "x-api-key: $ADMIN_KEY")"
head -c 3000 /tmp/usage.json
echo
echo scan_end
