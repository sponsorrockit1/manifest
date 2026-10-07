#!/usr/bin/env python3
import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"

def rkey(fn):
    return open(fn).read().strip().split("=", 1)[1].strip()

ADMIN = rkey("mnfst_admin_ai_key.txt")
PROBE = rkey("mnfst_probe_agent_key.txt")

def raw(method, path, key=None, body=None, headers=None, use_x=False):
    h = dict(headers or {})
    if key and use_x:
        h["x-api-key"] = key
    h["Content-Type"] = "application/json"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, method=method, headers=h, data=data)
    try:
        with urllib.request.urlopen(r, timeout=60) as x:
            return x.status, x.read().decode()[:1500]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:1500]
    except Exception as e:
        return -1, str(e)[:200]

print("### PROBE RAW ###")
st, b = raw("POST", "/v1/chat/completions",
            headers={"Authorization": "Bearer " + PROBE},
            body={"messages": [{"role": "user", "content": "Reply with exactly OK"}], "max_tokens": 16})
print("http", st)
print(b[:1200])

print("\n### AVAILABLE-MODELS GET RAW (no query) ###")
st, b = raw("GET", "/api/v1/routing/cron-probe/available-models", key=ADMIN, use_x=True)
print("http", st)
print(b[:1500])
