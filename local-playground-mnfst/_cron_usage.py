#!/usr/bin/env python3
import json
d=json.load(open('/home/smcrae/repos/sponsorrockit1/playground/mnfst/usage.json'))
print(json.dumps(d, indent=1)[:3000])
