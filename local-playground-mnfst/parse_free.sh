#!/usr/bin/env bash
python3 - <<'PY'
import json
d=json.load(open('/tmp/cat_cron-probe.json'))
items=d if isinstance(d,list) else d.get('models') or d.get('data') or []
print('total',len(items))
def z(m): return (m.get('input_price_per_token') or 0)==0 and (m.get('output_price_per_token') or 0)==0
free=[m for m in items if ':free' in (m.get('model_name') or '') or z(m)]
byp={}
for m in free: byp.setdefault(m.get('provider'),[]).append(m.get('model_name'))
for p,v in byp.items():
    print(p, len(v))
    for n in sorted(v): print('   ',n)
PY
