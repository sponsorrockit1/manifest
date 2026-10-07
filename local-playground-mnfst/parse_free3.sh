#!/usr/bin/env bash
python3 - <<'PY'
import json
d=json.load(open('/tmp/cat_cron-probe.json'))
items=d if isinstance(d,list) else d.get('models') or d.get('data') or []
for p in ['openrouter','groq','gemini']:
    f=sorted(m['model_name'] for m in items if m.get('provider')==p and ':free' in m.get('model_name',''))
    print('==',p,'colonfree',len(f))
    for n in f: print('   ',n)
PY
