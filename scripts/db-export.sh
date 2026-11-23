#!/usr/bin/env bash
# 导出数据库为单个 SQL 文件：pnpm db:export
# 导入：mysql -u用户 -p 数据库名 < backups/xxx.sql
set -euo pipefail
cd "$(dirname "$0")/.."
URL=$(grep -E '^DATABASE_URL=' .env.local 2>/dev/null | cut -d= -f2- || true)
URL=${DATABASE_URL:-$URL}
[ -z "$URL" ] && { echo "未找到 DATABASE_URL"; exit 1; }
proto_removed=${URL#mysql://}
creds=${proto_removed%%@*}; hostpart=${proto_removed#*@}
USER=${creds%%:*}; PASS=${creds#*:}
HOSTPORT=${hostpart%%/*}; DB=${hostpart#*/}; DB=${DB%%\?*}
HOST=${HOSTPORT%%:*}; PORT=${HOSTPORT#*:}; [ "$PORT" = "$HOST" ] && PORT=3306
mkdir -p backups
OUT="backups/${DB}-$(date +%Y%m%d-%H%M%S).sql"
MYSQL_PWD="$PASS" mysqldump -h"$HOST" -P"$PORT" -u"$USER" \
  --single-transaction --routines --triggers --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 --databases "$DB" > "$OUT"
echo "✓ 已导出到 $OUT"
