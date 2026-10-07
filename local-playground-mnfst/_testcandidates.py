import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"
AK = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
PK = open("mnfst_probe_agent_key.txt").read().strip().split("=", 1)[1].strip()
H = {"x-api-key": AK}

def get_models():
    r = urllib.request.Request(BASE + "/api/v1/routing/cron-probe/available-models", headers=H)
    with urllib.request.urlopen(r, timeout=60) as x:
        return json.loads(x.read())

def chat(model):
    body = {"model": model, "messages": [{"role": "user", "content": "Reply with exactly CAND_OK"}], "max_tokens": 30}
    r = urllib.request.Request(BASE + "/v1/chat/completions", method="POST",
                               headers={"Authorization": "Bearer " + PK, "Content-Type": "application/json"},
                               data=json.dumps(body).encode())
    try:
        with urllib.request.urlopen(r, timeout=120) as x:
            d = json.loads(x.read())
            c = d["choices"][0]["message"].get("content") or ""
            return x.status, d.get("model"), ("CONTENT_OK" if c.strip() else "200_EMPTY")
    except urllib.error.HTTPError as e:
        return e.code, "ERR", e.read().decode()[:100]

models = get_models()
cands = [m for m in models if (
    (m["provider"] == "openrouter" and any(s in m["model_name"] for s in
        ["stealth/ox-alpha", "nemotron-3.5-lightning", "laguna-s-2.1", "glm-5.2"]))
    or (m["provider"] == "nvidia" and "thinkingmachines/inkling" in m["model_name"])
)]
print(f"candidates found in catalog: {len(cands)}")
for m in cands:
    mid = m["model_name"]
    st, served, txt = chat(mid)
    print(f"  {m['provider']:11} {mid:45} -> {st} | served={served} | {txt}")
