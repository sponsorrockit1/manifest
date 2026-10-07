import json
d=json.load(open('/home/smcrae/repos/sponsorrockit1/playground/mnfst/avail.json'))

def is_free(m):
    ip=m.get('input_price_per_token') or 0
    op=m.get('output_price_per_token') or 0
    return (ip==0 and op==0) or str(m.get('model_name','')).endswith(':free')

free=[m for m in d if is_free(m)]
print("TOTAL free models:",len(free))

# Currently wired native ids
wired=set([
 'nvidia/nemotron-3-super-120b-a12b:free',
 'openai/gpt-oss-120b',
 'gemini-2.5-flash',
 'tencent/hy3:free',
 'moonshot-v1-8k',
])
print("\n=== Wired models present in catalog? ===")
for w in wired:
    hit=[m for m in free if m['model_name']==w]
    print(f"  {w}: {'FOUND ctx='+str(hit[0]['context_window'])+' q='+str(hit[0]['quality_score']) if hit else 'NOT-IN-FREE-LIST'}")

provs=['openrouter','groq','gemini','nvidia','moonshot']
print("\n=== Free models per provider (sorted by quality desc, then context desc) ===")
for p in provs:
    ms=[m for m in free if m['provider']==p]
    ms.sort(key=lambda m:(-(m.get('quality_score') or 0),-(m.get('context_window') or 0)))
    print(f"\n-- {p} ({len(ms)} free) --")
    for m in ms[:12]:
        nm=m['model_name']
        tag=' [WIRED]' if nm in wired else ''
        print(f"   {nm} ctx={m.get('context_window')} q={m.get('quality_score')} code={m.get('capability_code')} reason={m.get('capability_reasoning')}{tag}")

# Specifically look for NEWER/stronger openrouter :free not wired
print("\n=== openrouter :free NOT currently wired, quality>=3 ===")
orr=[m for m in free if m['provider']=='openrouter' and m['model_name'].endswith(':free') and m['model_name'] not in wired]
orr.sort(key=lambda m:(-(m.get('quality_score') or 0),-(m.get('context_window') or 0)))
for m in orr[:20]:
    print(f"   {m['model_name']} ctx={m.get('context_window')} q={m.get('quality_score')} code={m.get('capability_code')} reason={m.get('capability_reasoning')}")
print("   ...total openrouter :free not wired:",len(orr))
