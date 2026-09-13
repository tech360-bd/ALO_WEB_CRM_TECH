#!/bin/bash
B=http://localhost:3000
PW="$SEED_PORTAL_PASSWORD"
login() { curl -s -X POST "$B/api/portal-auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$PW\",\"portalType\":\"$2\"}"; }
tok() { login "$1" "$2" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('token') or d.get('data',{}).get('token') or (d.get('data') or {}).get('session',{}).get('token','') if isinstance(d.get('data'),dict) else '')" 2>/dev/null; }
echo "== LOGIN MATRIX =="
for u in "administrator@alo.edu.bd admin" "counselor@alo.edu.bd employee" "finance@alo.edu.bd employee" "visa_officer@alo.edu.bd employee" "hr@alo.edu.bd employee" "marketing_manager@alo.edu.bd employee" "student@alo.edu.bd student" "partner@alo.edu.bd partner"; do
  set -- $u; r=$(login "$1" "$2" | head -c 120); echo "$1 [$2] => $r"
done
CT=$(tok counselor@alo.edu.bd employee); AT=$(tok administrator@alo.edu.bd admin)
echo; echo "== RBAC MATRIX (counselor vs super-admin) =="
for ep in "/api/employee/dashboard" "/api/super-admin/dashboard" "/api/crm/dashboard" "/api/student/dashboard"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CT" "$B$ep")
  a=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $AT" "$B$ep")
  n=$(curl -s -o /dev/null -w "%{http_code}" "$B$ep")
  echo "$ep  no-auth=$n  counselor=$c  super_admin=$a"
done
echo; echo "== PUBLIC DATA =="
curl -s "$B/api/universities?limit=2" | head -c 300; echo
