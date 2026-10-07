import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"
AK = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
H = {"x-api-key": AK, "Content-Type": "application/json"}

def call(method, path, body=None):
    r = urllib.request.Request(BASE + path, method=method, headers=H,
                               data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=30) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]

# Primary per role + shared fallback chain across all 5 providers.
PRIMARY = {
    "hermes-orch": {"model": "nvidia/nemotron-3-super-120b-a12b:free", "provider": "openrouter", "authType": "api_key"},
    "hermes-coder": {"model": "openai/gpt-oss-120b", "provider": "groq", "authType": "api_key"},
}
FALLBACKS = [
    {"model": "openai/gpt-oss-120b", "provider": "groq", "authType": "api_key"},
    {"model": "gemini-2.5-flash", "provider": "gemini", "authType": "api_key"},
    {"model": "tencent/hy3:free", "provider": "openrouter", "authType": "api_key"},
    {"model": "moonshot-v1-8k", "provider": "moonshot", "authType": "api_key"},
]

for agent in ["hermes-orch", "hermes-coder"]:
    print(f"===== {agent} =====")
    prim = PRIMARY[agent]
    st, resp = call("PUT", f"/api/v1/routing/{agent}/tiers/default", prim)
    print(f"  set default -> {prim['provider']}/{prim['model']}: {st} {str(resp)[:80]}")
    # fallbacks exclude this agent's own primary
    fb = [f for f in FALLBACKS if f["model"] != prim["model"] or f["provider"] != prim["provider"]]
    st, resp = call("PUT", f"/api/v1/routing/{agent}/tiers/default/fallbacks", {"models": [f["model"] for f in fb], "routes": fb})
    print(f"  set fallbacks ({len(fb)}): {st} {str(resp)[:80]}")
