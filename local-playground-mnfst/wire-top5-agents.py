#!/usr/bin/env python3
"""Wire top-5 free providers + 2 agents on the live mnfst box.
Reads keys from setup.md (never printed), attaches + match-verifies via the
admin API, creates hermes-orch + hermes-coder. mnfst routes across all enabled
tenant providers automatically, so attaching the keys + creating agents is the
full static wiring. Prints only status, never secrets.
"""
import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"
ADMIN_KEY = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
HEADERS = {"x-api-key": ADMIN_KEY, "Content-Type": "application/json"}

raw = open("setup.md").read()
lines = raw.splitlines()

def grab_after(anchor):
    for i, ln in enumerate(lines):
        if anchor in ln:
            if "=" in ln:
                v = ln.split("=", 1)[1].strip().strip('"')
                if v:
                    return v
            for j in range(i + 1, min(i + 3, len(lines))):
                cand = lines[j].strip().strip('"')
                if cand and not cand.endswith("!") and "http" not in cand and "docker" not in cand and "postgres" not in cand:
                    return cand
    return None

keys = {
    "openrouter": grab_after("OPENROUTER_API_KEY"),
    "groq":       grab_after("GROQ_API_KEY"),
    "deepseek":   grab_after("deepseek"),
    "nvidia":     grab_after("NVIDIA"),
    "gemini":     grab_after("GOOGLE_API_KEY"),
}

def api(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, headers=HEADERS,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]

print("########## PROVIDER KEYS ##########")
for prov, key in keys.items():
    if not key:
        print(f"  {prov}: NO KEY FOUND — skipping")
        continue
    st, resp = api("POST", f"/api/v1/admin/providers/{prov}/keys", {"apiKey": key})
    attached = st == 200 and isinstance(resp, dict) and resp.get("attached") is True
    vst, vresp = api("POST", f"/api/v1/admin/providers/{prov}/keys/verify", {"apiKey": key})
    match = vresp.get("match") if isinstance(vresp, dict) else None
    print(f"  {prov}: attach={attached} verify_match={match}")

print("########## AGENTS ##########")
for name, cat, plat in [("hermes-orch", "personal", "hermes"), ("hermes-coder", "coding", "hermes")]:
    st, resp = api("POST", "/api/v1/admin/agents", {"name": name, "agent_category": cat, "agent_platform": plat})
    ok = st == 200 and isinstance(resp, dict) and "agent" in resp
    ak = (resp.get("apiKey", "")[:18] + "…") if isinstance(resp, dict) and resp.get("apiKey") else ""
    print(f"  create {name}: ok={ok} {ak}")

print("DONE")
