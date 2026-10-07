import json
d=json.load(open('/home/smcrae/repos/sponsorrockit1/playground/mnfst/avail.json'))
print("LIST len:",len(d))
e=d[0]
print("elem0 type:",type(e))
if isinstance(e,dict):
    print("elem0 keys:",list(e.keys()))
    print("elem0 sample:",json.dumps(e)[:600])
