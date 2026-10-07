#!/usr/bin/env python3
import json, urllib.request, urllib.error
BASE = "http://100.84.145.125:62400"
def rkey(fn): return open(fn).read().strip().split("=", 1)[1].strip()
ADMIN = rkey("mnfst_admin_ai_key.txt")
def req(method, path):
    h = {"x-api-key": ADMIN, "Content-Type": "application/json"}
    r = urllib.request.Request(BASE + path, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)[:200]
for agent in ["hermes-orch", "hermes-coder", "cron-probe"]:
    st, d = req("GET", f"/api/v1/routing/{agent}/tiers/default")
    print(f"### {agent} (http {st})")
    print(json.dumps(d, indent=1)[:1200])
    print()
