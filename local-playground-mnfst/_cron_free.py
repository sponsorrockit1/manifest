#!/usr/bin/env python3
import json
d=json.load(open('/home/smcrae/repos/sponsorrockit1/playground/mnfst/catalog.json'))
# free = price 0 for either token OR name ends/contains ':free'
def is_free(m):
    p0 = m.get('input_price_per_token',1) in (0,0.0) or m.get('output_price_per_token',1) in (0,0.0)
    nm = m.get('model_name','')
    return p0 or ':free' in nm
free=[m for m in d if is_free(m)]
print("TOTAL models:", len(d), " FREE/zero-cost:", len(free))
from collections import defaultdict
by=defaultdict(list)
for m in free:
    by[m['provider']].append(m)
for prov in sorted(by):
    print("=== provider:", prov, "(", len(by[prov]), "free ) ===")
    for m in sorted(by[prov], key=lambda x:x.get('model_name','')):
        print(f"  {m['model_name']}  ctx={m.get('context_window')}  q={m.get('quality_score')}  "
              f"reason={m.get('capability_reasoning')} code={m.get('capability_code')} "
              f"in={m.get('input_price_per_token')} out={m.get('output_price_per_token')}")
# Also show wired-model presence + their cost
print("=== WIRED MODEL CHECK ===")
wired=["nvidia/nemotron-3-super-120b-a12b:free","openai/gpt-oss-120b","gemini-2.5-flash","tencent/hy3:free","moonshot-v1-8k","nvidia/nemotron-3.5-lightning:free"]
names={m['model_name']:m for m in d}
for w in wired:
    if w in names:
        m=names[w]
        print(f"  {w}: present ctx={m.get('context_window')} q={m.get('quality_score')} in={m.get('input_price_per_token')} out={m.get('output_price_per_token')}")
    else:
        print(f"  {w}: NOT in catalog")
