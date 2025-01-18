#!/usr/bin/env bash
set -euo pipefail

command -v rimraf >/dev/null 2>&1 || {
  echo "rimraf is required but not installed."
  exit 1
}
command -v tsc >/dev/null 2>&1 || {
  echo "tsc is required but not installed."
  exit 1
}
command -v rollup >/dev/null 2>&1 || {
  echo "rollup is required but not installed."
  exit 1
}

rimraf dist gh-page/bundled_deps
sed -i "s/\(const PACKAGE_VERSION\).*/\1 = '$(jq -r '.version' package.json)';/" ./fetch-github-folder.ts
sed -i "s/\(const PACKAGE_NAME\).*/\1 = '$(jq -r '.name' package.json)';/" ./fetch-github-folder.ts
tsc
mkdir -p ./dist/minified
rollup -c ./rollup.config.js
chmod +x ./dist/fetch-github-folder.js ./dist/minified/fetch-github-folder.js
