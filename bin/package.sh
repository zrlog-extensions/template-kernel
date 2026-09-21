#!/usr/bin/env bash
set -euo pipefail
THEME_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLKIT="${ZRLOG_TEMPLATES_DIR:-$THEME_ROOT/../templates}"
if [[ ! -f "$TOOLKIT/bin/theme" ]]; then
    echo 'Clone zrlog-extensions/templates next to this repository or set ZRLOG_TEMPLATES_DIR.' >&2
    exit 1
fi
exec "$TOOLKIT/bin/theme" build "$THEME_ROOT" --output-dir "$THEME_ROOT/dist"
