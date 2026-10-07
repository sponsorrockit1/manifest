import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"
AK = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
H = {"x-api-key": AK, "Content-Type": "application/json"}

def call(m, p, b=None):
    r = urllib.request.Request(BASE + p, method=m, headers=H,
                               data=json.dumps(b).encode() if b is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=30) as x:
            return x.status, json.loads(x.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:150]

# New chain: lightning primary (openrouter), then groq, gemini, laguna, moonshot
CHAIN = [
    {"model": "openai/gpt-oss-120b", "provider": "groq", "authType": "api_key"},
    {"model": "gemini-2.5-flash", "provider": "gemini", "authType": "api_key"},
    {"model": "poolside/laguna-s-2.1:free", "provider": "openrouter", "authType": "api_key"},
    {"model": "moonshot-v1-8k", "provider": "moonshot", "authType": "api_key"},
]
PRIMARY = {
    "hermes-orch": {"model": "nvidia/nemotron-3.5-lightning:free", "provider": "openrouter"},
    "hermes-coder": {"model": "poolside/laguna-s-2.1:free", "provider": "openrouter"},
    "cron-probe": {"model": "nvidia/nemotron-3.5-lightning:free", "provider": "openrouter"},
}
for agent, prim in PRIMARY.items():
    body = dict(prim); body["authType"] = "api_key"
    st, _ = call("PUT", f"/api/v1/routing/{agent}/tiers/default", body)
    fb = [f for f in CHAIN if f["model"] != prim["model"]]
    st2, r2 = call("PUT", f"/api/v1/routing/{agent}/tiers/default/fallbacks",
                   {"models": [f["model"] for f in fb], "routes": fb})
    print(f"{agent}: primary={prim['model']} ({st}) fallbacks={len(fb)} ({st2})")

# verify end-to-end with probe (auto, no model)
PK = open("mnfst_probe_agent_key.txt").read().strip().split("=", 1)[1].strip()
b = {"messages": [{"role": "user", "content": "Reply with exactly SWAP_OK"}], "max_tokens": 30}
r = urllib.request.Request(BASE + "/v1/chat/completions", method="POST",
                           headers={"Authorization": "Bearer " + PK, "Content-Type": "application/json"},
                           data=json.dumps(b).encode())
with urllib.request.urlopen(r, timeout=120) as x:
    d = json.loads(x.read())
    c = d["choices"][0]["message"].get("content") or ""
    print(f"probe auto -> {d.get('model')} | {'SWAP VERIFIED' if c.strip() else 'EMPTY'}")
