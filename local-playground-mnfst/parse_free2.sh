#!/usr/bin/env bash
python3 - <<'PY'
import json
d=json.load(open('/tmp/cat_cron-probe.json'))
items=d if isinstance(d,list) else d.get('models') or d.get('data') or []
provs={}
for m in items: provs[m.get('provider')]=provs.get(m.get('provider'),0)+1
print({k:v for k,v in provs.items() if not str(k).startswith('custom:')})
def z(m): return (m.get('input_price_per_token') or 0)==0 and (m.get('output_price_per_token') or 0)==0
for p in ['openrouter','groq','gemini','nvidia','moonshot']:
    f=[m['model_name'] for m in items if m.get('provider')==p and (':free' in m.get('model_name','') or z(m))]
    print(p,'free_count',len(f))
    for n in sorted(f): print('   ',n)
PY
