#!/usr/bin/env python3
import json
d=json.load(open('/home/smcrae/repos/sponsorrockit1/playground/mnfst/catalog.json'))
print('TOP KEYS:', list(d.keys()) if isinstance(d,dict) else type(d))
print('SAMPLE:', json.dumps(d, indent=1)[:1800])
