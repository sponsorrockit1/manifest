#!/usr/bin/env python3
"""Smoke-test hermes-orch + hermes-coder across the 5 free providers using
REAL model slugs from the box's available-models registry. Rotates each
agent's ingest key (returns it once), calls /v1/chat/completions. Prints only
served model/provider, never the key value.
"""
import json, urllib.request, urllib.error

BASE = "http://100.84.145.125:62400"
ADMIN_KEY = open("mnfst_admin_ai_key.txt").read().strip().split("=", 1)[1].strip()
AHEAD = {"x-api-key": ADMIN_KEY, "Content-Type": "application/json"}

def admin(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, headers=AHEAD,
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read().decode())

def proxy_chat(agent_key, model, prompt):
    body = {"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": 40}
    req = urllib.request.Request(BASE + "/v1/chat/completions", method="POST",
                                 headers={"Authorization": "Bearer " + agent_key, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = json.loads(r.read().decode())
            return r.status, data.get("model", "?"), data["choices"][0]["message"]["content"][:60]
    except urllib.error.HTTPError as e:
        return e.code, "ERR", e.read().decode()[:150]

# Real slugs from the box registry (post-refresh)
TESTS = [
    ("auto", "Reply with the single word: ROUTING_OK"),
    ("openrouter/nvidia/nemotron-3-super-120b-a12b:free", "Say NV_FREE if you are free."),
    ("openrouter/qwen/qwen3-next-80b-a3b-instruct:free", "Say QWEN_FREE if free."),
    ("groq/openai/gpt-oss-120b", "Say GROQ_OK if free."),
    ("deepseek/deepseek-v4-flash", "Say DS_OK if free."),
    ("gemini/gemini-2.5-flash", "Say GEM_OK if free."),
]

for name in ["hermes-orch", "hermes-coder"]:
    st, resp = admin("POST", f"/api/v1/admin/agents/{name}/rotate-key")
    agent_key = resp.get("apiKey", "")
    print(f"\n===== {name} (key len {len(agent_key)}, value withheld) =====")
    for model, prompt in TESTS:
        code, served, text = proxy_chat(agent_key, model, prompt)
        print(f"  {model!r:52} -> HTTP {code} | served={served} | {text!r}")
