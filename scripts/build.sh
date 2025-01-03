#!/usr/bin/env bash
set -euo pipefail

command -v rimraf >/dev/null 2>&1 || { echo "rimraf is required but not installed."; exit 1; }
command -v tsc >/dev/null 2>&1 || { echo "tsc is required but not installed."; exit 1; }

rimraf dist

tsc
mkdir -p ./dist/minified
rollup -c ./rollup.config.js
chmod +x ./dist/index.js ./dist/minified/index.js
