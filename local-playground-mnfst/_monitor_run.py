#!/usr/bin/env python3
import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"

def rkey(fn):
    return open(fn).read().strip().split("=", 1)[1].strip()

ADMIN = rkey("mnfst_admin_ai_key.txt")
PROBE = rkey("mnfst_probe_agent_key.txt")

def req(method, path, key=None, body=None, headers=None):
    h = dict(headers or {})
    if key:
        h["x-api-key"] = key
    h["Content-Type"] = "application/json"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, method=method, headers=h, data=data)
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, e.read().decode()[:200]
    except Exception as e:
        return -1, str(e)[:200]

print("### PROPER PROBE (model=auto) ###")
st, d = req("POST", "/v1/chat/completions",
            headers={"Authorization": "Bearer " + PROBE},
            body={"messages": [{"role": "user", "content": "Reply with exactly OK"}], "max_tokens": 16})
print("probe_http=", st)
if isinstance(d, dict):
    print("probe_served_model=", d.get("model", "?"))
    try:
        c = d["choices"][0]["message"]["content"]
        print("probe_content=", (c.strip()[:40] if c else "EMPTY"))
    except Exception as e:
        print("probe_content=ERR:", str(e)[:60])
else:
    print("probe_raw=", str(d)[:120])

print("\n### STEP 2: AVAILABLE-MODELS CATALOGS ###")
# trigger refresh, then fetch
for prov in ["openrouter", "groq", "gemini", "nvidia", "moonshot"]:
    st, r = req("POST", "/api/v1/routing/cron-probe/available-models",
                key=ADMIN, body={"provider": prov})
    # GET
    st2, r2 = req("GET", "/api/v1/routing/cron-probe/available-models?provider=" + prov, key=ADMIN)
    models = []
    if isinstance(r2, dict):
        models = r2.get("models") or r2.get("data") or r2.get(prov) or []
    if isinstance(models, dict):
        models = list(models.keys())
    free = [m for m in models if isinstance(m, str) and ":free" in m]
    print(f"[{prov}] refresh={st} get={st2} total={len(models)} free={len(free)}")
    # show a few free samples (newest/strongest heuristic: longer id)
    if free:
        for m in sorted(free)[:8]:
            print("   FREE:", m)
PY = None
