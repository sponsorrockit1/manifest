#!/usr/bin/env bash
set -u
cd /home/smcrae/repos/sponsorrockit1/playground/mnfst
BASE=http://100.84.145.125:62400
PK=$(grep '^PROBE_KEY=' mnfst_probe_agent_key.txt | cut -d= -f2-)
AK=$(grep '^ADMIN_KEY=' mnfst_admin_ai_key.txt | cut -d= -f2-)
echo "=== PROBE raw (real key) ==="
RESP=$(curl -s --max-time 120 -X POST $BASE/v1/chat/completions -H "Authorization: Bearer $PK" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Reply with exactly OK"}],"max_tokens":16}')
echo "$RESP" | python3 -c 'import sys,json
raw=sys.stdin.read()
try:
    d=json.loads(raw)
    print("KEYS:",list(d.keys()))
    print("model:",d.get("model"))
    print("choices:",json.dumps(d.get("choices"))[:300])
    if "error" in d: print("ERROR:",json.dumps(d["error"])[:300])
except Exception as e:
    print("PARSE_FAIL:",raw[:400])'
echo
echo "=== available-models POST ==="
curl -s -o /dev/null -w "post_status=%{http_code}\n" -X POST $BASE/api/v1/routing/cron-probe/available-models -H "x-api-key: $AK"
echo "=== available-models GET ==="
curl -s --max-time 60 $BASE/api/v1/routing/cron-probe/available-models -H "x-api-key: $AK" -o avail.json -w "get_status=%{http_code} bytes=%{size_download}\n"
echo "=== observability usage ==="
curl -s --max-time 30 $BASE/api/v1/admin/observability/usage -H "x-api-key: $AK" -o usage.json -w "usage_status=%{http_code} bytes=%{size_download}\n"
