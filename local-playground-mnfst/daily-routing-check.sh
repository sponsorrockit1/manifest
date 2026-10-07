#!/usr/bin/env bash
# Daily mnfst free-routing health + freshness check.
# Called by the hermes cronjob 'mnfst-free-routing-daily'.
# Prints a compact report to stdout (delivered by cron).
set -u
cd /home/smcrae/repos/sponsorrockit1/playground/mnfst
BASE=http://100.84.145.125:62400

if [ ! -f mnfst_admin_ai_key.txt ]; then echo "FATAL: admin key file missing"; exit 1; fi

echo "# mnfst daily routing report — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ---- 1. box health ----
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $BASE/api/v1/health)
echo "box_health=$HEALTH"
if [ "$HEALTH" != "200" ]; then echo "ALERT: mnfst box unhealthy ($HEALTH)"; exit 1; fi

# ---- 2. probe agent end-to-end (auto contract, no model pinned) ----
PK=$(grep '^PROBE_KEY=' mnfst_probe_agent_key.txt | cut -d= -f2-)
RESP=$(curl -s --max-time 120 -X POST $BASE/v1/chat/completions \
  -H "Authorization: Bearer $PK" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Reply with exactly OK"}],"max_tokens":16}')
PROBE_MODEL=$(printf '%s' "$RESP" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("model","?"))
except Exception: print("PARSE_FAIL")' 2>/dev/null)
PROBE_CODE=$(printf '%s' "$RESP" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin); c=d["choices"][0]["message"]["content"]
    print("200_OK" if c.strip() else "200_EMPTY")
except Exception: print("NO_VALID_CHOICE")' 2>/dev/null)
echo "probe_served_model=$PROBE_MODEL"
echo "probe_content_status=$PROBE_CODE"

# ---- 3. per-leg provider reachability (each candidate free route) ----
python3 - <<PY
import json,urllib.request,urllib.error,time
BASE="$BASE"
AK=open("mnfst_admin_ai_key.txt").read().strip().split("=",1)[1].strip()
H={"x-api-key":AK,"Content-Type":"application/json"}
def call(m,p,b=None):
    r=urllib.request.Request(BASE+p,method=m,headers=H,data=json.dumps(b).encode() if b is not None else None)
    try:
        with urllib.request.urlopen(r,timeout=30) as x: return x.status,json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code,e.read().decode()[:150]
LEGS=[
 ("openrouter","nvidia/nemotron-3-super-120b-a12b:free"),
 ("groq","openai/gpt-oss-120b"),
 ("gemini","gemini-2.5-flash"),
 ("openrouter","tencent/hy3:free"),
 ("moonshot","moonshot-v1-8k"),
]
for prov,mid in LEGS:
    st,r=call("PUT","/api/v1/routing/cron-probe/tiers/default",{"model":mid,"provider":prov,"authType":"api_key"})
    ok = st==200
    print(f"leg {prov}/{mid}: config={'OK' if ok else 'FAIL('+str(st)+')'}")
# restore probe primary
call("PUT","/api/v1/routing/cron-probe/tiers/default",{"model":"nvidia/nemotron-3-super-120b-a12b:free","provider":"openrouter","authType":"api_key"})
print("probe_primary_restored=openrouter/nemotron-free")
PY

echo "report_end"
