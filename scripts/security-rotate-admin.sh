#!/bin/bash
# One-time admin credential rotation for V FORM (run from the repo root).
#  1. New random admin password -> ~/Desktop/VFORM-admin-password.txt (chmod 600, never printed)
#  2. Its scrypt hash -> Vercel env ADMIN_PASSWORD_HASH (production)
#  3. Rotates ADMIN_SESSION_SECRET (logs out every existing admin session)
#  4. Copies the deploy hook to server-only DEPLOY_HOOK_URL and removes NEXT_PUBLIC_DEPLOY_HOOK_URL
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

PW=$(python3 -c "import secrets;print(secrets.token_urlsafe(15))")
PWF="$HOME/Desktop/VFORM-admin-password.txt"
printf 'V FORM admin login: https://www.vform-nutrition.com/admin\nEmail: one of the admin emails\nPassword: %s\nCreated: %s\n' "$PW" "$(date)" > "$PWF"
chmod 600 "$PWF"
PW="$PW" node -e "const c=require('crypto');const s=c.randomBytes(16);process.stdout.write('scrypt\$'+s.toString('hex')+'\$'+c.scryptSync(process.env.PW,s,32).toString('hex'))" > "$TMP/hash"
unset PW

vercel env rm ADMIN_PASSWORD_HASH production -y >/dev/null 2>&1 || true
vercel env add ADMIN_PASSWORD_HASH production < "$TMP/hash" >/dev/null
echo "ADMIN_PASSWORD_HASH set"

python3 -c "import secrets;print(secrets.token_hex(32),end='')" > "$TMP/sess"
vercel env rm ADMIN_SESSION_SECRET production -y >/dev/null
vercel env add ADMIN_SESSION_SECRET production < "$TMP/sess" >/dev/null
echo "ADMIN_SESSION_SECRET rotated"

vercel env pull "$TMP/prod.env" --environment=production -y >/dev/null 2>&1
HOOK=$(grep '^NEXT_PUBLIC_DEPLOY_HOOK_URL=' "$TMP/prod.env" | cut -d= -f2- | tr -d '"' || true)
if [ -n "$HOOK" ]; then
  printf '%s' "$HOOK" > "$TMP/hook"
  vercel env rm DEPLOY_HOOK_URL production -y >/dev/null 2>&1 || true
  vercel env add DEPLOY_HOOK_URL production < "$TMP/hook" >/dev/null
  vercel env rm NEXT_PUBLIC_DEPLOY_HOOK_URL production -y >/dev/null
  echo "Deploy hook moved to server-only DEPLOY_HOOK_URL"
else
  echo "NEXT_PUBLIC_DEPLOY_HOOK_URL not found - skipped"
fi
echo "Done. New password is in $PWF"
