import json, urllib.request

BASE = "http://100.84.145.125:62400"
AK = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
H = {"x-api-key": AK, "Content-Type": "application/json"}

def get(path):
    r = urllib.request.Request(BASE + path, headers=H, method="GET")
    with urllib.request.urlopen(r, timeout=30) as x:
        return json.loads(x.read())

print("=== providers (top5 + moonshot) ===")
d = get("/api/v1/admin/providers")
for p in d["providers"]:
    if p["provider"] in ("openrouter", "groq", "deepseek", "nvidia", "gemini", "moonshot"):
        print("  %-12s has_key=%s active=%s" % (p["provider"], p.get("has_key"), p.get("is_active")))

print("=== agents ===")
d = get("/api/v1/agents")
for a in d["agents"]:
    if a["agent_name"] in ("hermes-orch", "hermes-coder"):
        print("  %s  cat=%s plat=%s" % (a["agent_name"], a["agent_category"], a["agent_platform"]))

print("=== hermes-orch enabled providers (deepseek should be absent) ===")
d = get("/api/v1/agents/hermes-orch/enabled-providers")
print("  enabled count:", len(d))
print("  deepseek present:", any("deepseek" in str(e).lower() for e in d))
