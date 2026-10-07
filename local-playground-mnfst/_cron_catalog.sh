#!/usr/bin/env bash
set -u
cd /home/smcrae/repos/sponsorrockit1/playground/mnfst
BASE=http://100.84.145.125:62400
AK=$(grep '^ADMIN_KEY=' mnfst_admin_ai_key.txt | cut -d= -f2-)
echo "POST refresh: $(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/routing/cron-probe/available-models -H "x-api-key: $AK")"
curl -s $BASE/api/v1/routing/cron-probe/available-models -H "x-api-key: $AK" -o catalog.json
echo "GET catalog bytes: $(wc -c < catalog.json)"
echo "usage status: $(curl -s -o usage.json -w '%{http_code}' $BASE/api/v1/admin/observability/usage -H "x-api-key: $AK")"
echo "usage bytes: $(wc -c < usage.json)"
