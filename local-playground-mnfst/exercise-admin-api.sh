#!/usr/bin/env bash
# Full admin-API route exercise against the live mnfst box.
# Admin key is read from mnfst_admin_ai_key.txt (never echoed).
set -u
BASE=http://100.84.145.125:62400
AK=$(grep '^ADMIN_KEY=' mnfst_admin_ai_key.txt | cut -d= -f2-)
H="x-api-key: $AK"
jqget() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null; }

echo "########## ADMIN KEYS ##########"
echo "[GET /admin/keys]"; curl -s -H "$H" $BASE/api/v1/admin/keys | jqget 'len([d]) if False else d' 2>/dev/null
LIST_BEFORE=$(curl -s -H "$H" $BASE/api/v1/admin/keys)
echo "  keys before: $(echo "$LIST_BEFORE" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)"
echo "[POST /admin/keys] create key2"; CUR=$(curl -s -H "$H" -H "Content-Type: application/json" -d '{"name":"test-key-2"}' $BASE/api/v1/admin/keys)
echo "  -> $(echo "$CUR" | head -c 160)"
LIST_AFTER=$(curl -s -H "$H" $BASE/api/v1/admin/keys)
echo "  keys after: $(echo "$LIST_AFTER" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)"

echo "########## AGENTS ##########"
echo "[GET /admin/agents] before"; curl -s -H "$H" $BASE/api/v1/admin/agents | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  count:",len(d) if isinstance(d,list) else d)' 2>/dev/null
echo "[POST /admin/agents] create 'apitest-orch'"; NEW=$(curl -s -H "$H" -H "Content-Type: application/json" -d '{"name":"apitest-orch","agent_category":"coding","agent_platform":"hermes"}' $BASE/api/v1/admin/agents)
echo "  -> $(echo "$NEW" | head -c 200)"
echo "[GET /admin/agents/apitest-orch]"; curl -s -H "$H" $BASE/api/v1/admin/agents/apitest-orch | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  agent_name:",d.get("agent_name") or d.get("name"))' 2>/dev/null
echo "[POST /admin/agents/apitest-orch/rotate-key]"; curl -s -H "$H" -X POST $BASE/api/v1/admin/agents/apitest-orch/rotate-key | head -c 120; echo
echo "[PATCH /admin/agents/apitest-orch] rename -> apitest-coder"; curl -s -H "$H" -H "Content-Type: application/json" -X PATCH -d '{"name":"apitest-coder"}' $BASE/api/v1/admin/agents/apitest-orch | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  ->",d.get("agent_name") or d.get("name") or str(d)[:80])' 2>/dev/null
echo "[POST /admin/agents/apitest-coder/duplicate -> apitest-copy]"; curl -s -H "$H" -H "Content-Type: application/json" -d '{"name":"apitest-copy"}' $BASE/api/v1/admin/agents/apitest-coder/duplicate | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  ->",d.get("agent_name") or d.get("name") or str(d)[:80])' 2>/dev/null
echo "[GET /admin/agents] after"; curl -s -H "$H" $BASE/api/v1/admin/agents | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  count:",len(d) if isinstance(d,list) else d); [print("   -",a.get("agent_name") or a.get("name")) for a in (d if isinstance(d,list) else []) if "apitest" in str(a)]' 2>/dev/null

echo "########## PROVIDERS ##########"
echo "[GET /admin/providers]"; curl -s -H "$H" $BASE/api/v1/admin/providers | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  count:",len(d["providers"]))' 2>/dev/null
TP="testverify-live-$(date +%s)"
TK="sk-live-$(head -c 10 /dev/urandom | base64 | tr -d '+/=')"
echo "[POST /admin/providers/$TP/keys] attach"; curl -s -H "$H" -H "Content-Type: application/json" -d "{\"apiKey\":\"$TK\"}" $BASE/api/v1/admin/providers/$TP/keys; echo
echo "[POST /admin/providers/$TP/keys/verify] SAME (expect match:true)"; curl -s -H "$H" -H "Content-Type: application/json" -d "{\"apiKey\":\"$TK\"}" $BASE/api/v1/admin/providers/$TP/keys/verify; echo
echo "[POST /admin/providers/$TP/keys/verify] WRONG (expect match:false)"; curl -s -H "$H" -H "Content-Type: application/json" -d '{"apiKey":"sk-nope"}' $BASE/api/v1/admin/providers/$TP/keys/verify; echo

echo "########## OBSERVABILITY ##########"
echo "[GET /admin/observability/usage]"; curl -s -H "$H" "$BASE/api/v1/admin/observability/usage" | head -c 120; echo
echo "[GET /admin/observability/agents/apitest-coder/routing]"; curl -s -H "$H" "$BASE/api/v1/admin/observability/agents/apitest-coder/routing" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  agent:",d.get("agent",{}).get("name"),"providers:",len(d.get("providers",[])))' 2>/dev/null

echo "########## CLEANUP (agents) ##########"
for A in apitest-coder apitest-copy; do
  echo "[DELETE /admin/agents/$A]"; curl -s -o /dev/null -w "  %{http_code}\n" -H "$H" -X DELETE $BASE/api/v1/admin/agents/$A
done
echo "[GET /admin/agents] final"; curl -s -H "$H" $BASE/api/v1/admin/agents | python3 -c 'import sys,json;d=json.load(sys.stdin);print("  apitest left:",[a.get("agent_name") or a.get("name") for a in (d if isinstance(d,list) else []) if "apitest" in str(a)])' 2>/dev/null
echo "DONE"