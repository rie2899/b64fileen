#!/usr/bin/env bash
# Push site URLs to IndexNow (Bing/Yandex/Seznam/Naver instant indexing).
#   bash scripts/indexnow.sh              # push every URL in dist/sitemap.xml
#   bash scripts/indexnow.sh <url> [...]  # push specific URLs (use when publishing a new page)
# Endpoint: Bing's own entry point by default (api.indexnow.net sometimes fails TLS through some
#        proxy nodes). Override: INDEXNOW_ENDPOINT=https://api.indexnow.net/IndexNow
# Proxy: overseas service, unreachable directly from mainland networks; defaults to 127.0.0.1:7897,
#        override with INDEXNOW_PROXY, set it empty for a direct connection.
set -euo pipefail
cd "$(dirname "$0")/.."

# Key file: public/<key>.txt — the file NAME is the key (32 hex chars).
# Match on that exact shape: a looser [A-Za-z0-9-] pattern would also grab other .txt files.
KEYFILE=$(find public -maxdepth 1 -type f -name '*.txt' -printf '%f\n' | grep -E '^[0-9a-f]{32}\.txt$' | head -1 || true)
[ -n "$KEYFILE" ] || { echo "✗ no public/<key>.txt found (IndexNow key file)"; exit 1; }
KEY="${KEYFILE%.txt}"
HOST=$(python3 -c "import json;print(json.load(open('site.config.json'))['siteUrl'].split('//')[-1].rstrip('/'))")
LOCATION="https://$HOST/$KEY.txt"
ENDPOINT="${INDEXNOW_ENDPOINT:-https://www.bing.com/indexnow}"

if [ "$#" -gt 0 ]; then
  URLS=("$@")
else
  [ -f dist/sitemap.xml ] || { echo "✗ dist/sitemap.xml missing — run pnpm build first"; exit 1; }
  mapfile -t URLS < <(grep -o '<loc>[^<]*</loc>' dist/sitemap.xml | sed 's|</\?loc>||g')
fi
[ "${#URLS[@]}" -gt 0 ] || { echo "✗ no URLs to push"; exit 1; }

PAYLOAD=$(python3 - "$HOST" "$KEY" "$LOCATION" "${URLS[@]}" <<'PY'
import json, sys
host, key, loc = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({"host": host, "key": key, "keyLocation": loc, "urlList": sys.argv[4:]}, ensure_ascii=False))
PY
)

PROXY="${INDEXNOW_PROXY-http://127.0.0.1:7897}"
PROXY_ARG=(); [ -n "$PROXY" ] && PROXY_ARG=(-x "$PROXY")

RESP="${TMPDIR:-/tmp}/indexnow-resp.txt"
echo "pushing ${#URLS[@]} URL(s) → $ENDPOINT"
echo "  host: $HOST | keyLocation: $LOCATION"
set +e
CODE=$(curl -s "${PROXY_ARG[@]}" --max-time 60 -o "$RESP" -w '%{http_code}' \
  -X POST "$ENDPOINT" -H 'Content-Type: application/json; charset=utf-8' -d "$PAYLOAD")
RC=$?
set -e
if [ "$RC" -ne 0 ]; then
  echo "✗ curl exit $RC (TLS/network failure: switch INDEXNOW_ENDPOINT or proxy node)"; exit 2
fi
case "$CODE" in
  200|202) echo "✓ HTTP $CODE 已受理（必应通常几分钟内来抓）";;
  400) echo "✗ HTTP 400 请求格式错";;
  403) echo "✗ HTTP 403 key 校验失败：确认 https://$HOST/$KEY.txt 能打开、内容就是 key";;
  422) echo "✗ HTTP 422 URL 与 host 不匹配";;
  429) echo "✗ HTTP 429 推太频繁";;
  *)   echo "✗ HTTP $CODE";;
esac
head -c 300 "$RESP" 2>/dev/null; echo
