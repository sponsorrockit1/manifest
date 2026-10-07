#!/usr/bin/env python3
import json, urllib.request, urllib.error
from collections import defaultdict

BASE = "http://100.84.145.125:62400"
def rkey(fn): return open(fn).read().strip().split("=", 1)[1].strip()
ADMIN = rkey("mnfst_admin_ai_key.txt")

def req(method, path, key=None, body=None):
    h = {"Content-Type": "application/json"}
    if key: h["x-api-key"] = key
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, method=method, headers=h, data=data)
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)[:200]

# Full catalog
st, models = req("GET", "/api/v1/routing/cron-probe/available-models", key=ADMIN)
print("CATALOG http=", st, "count=", len(models) if isinstance(models, list) else "n/a")
by_prov = defaultdict(list)
for m in (models if isinstance(models, list) else []):
    if not isinstance(m, dict): continue
    p = m.get("provider")
    nm = m.get("model_name", "?")
    free = ":free" in nm or m.get("input_price_per_token", 1) == 0.0 or m.get("output_price_per_token", 1) == 0.0
    by_prov[p].append((nm, m.get("context_window"), m.get("quality_score"), free, m.get("capability_reasoning")))

for p in sorted(by_prov):
    frees = [x for x in by_prov[p] if x[3]]
    print(f"\n## {p}: {len(by_prov[p])} models, {len(frees)} free")
    for nm, ctx, q, free, reason in sorted(frees, key=lambda z: -(z[2] or 0)):
        print(f"   FREE {nm} | ctx={ctx} q={q} reason={reason}")

print("\n### STEP 3: ADMIN USAGE (24h) ###")
st, u = req("GET", "/api/v1/admin/observability/usage", key=ADMIN)
print("usage http=", st)
print(json.dumps(u, indent=1)[:2000] if not isinstance(u, str) else u)
