import json, urllib.request

BASE = "http://100.84.145.125:62400"
AK = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
H = {"x-api-key": AK, "Content-Type": "application/json"}

def get(path):
    r = urllib.request.Request(BASE + path, headers=H, method="GET")
    with urllib.request.urlopen(r, timeout=30) as x:
        return json.loads(x.read())

for agent in ["hermes-orch", "hermes-coder"]:
    d = get(f"/api/v1/routing/{agent}/available-models")
    print(f"=== {agent}: {len(d)} discovered models ===")
    want = [
        ("gemini", "gemini-2.5-flash"),
        ("groq", "openai/gpt-oss-120b"),
        ("openrouter", "nvidia/nemotron-3-super-120b-a12b:free"),
        ("openrouter", "openai/gpt-oss-120b:free"),
        ("openrouter", "tencent/hy3:free"),
        ("moonshot", "moonshot-v1-8k"),
    ]
    index = {(m["provider"], m["model_name"]): m.get("auth_type") for m in d}
    for prov, mid in want:
        at = index.get((prov, mid))
        print(f"  {'OK ' if at else 'MISS'} {prov:11} {mid}  auth={at}")
