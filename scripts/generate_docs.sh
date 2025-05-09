#!/usr/bin/env bash
set -euo pipefail

# If you use vscode's live server plugin, it's better to leave this disabled,
# because recreation of the dir brakes hot-reload
# rm -rf tmp

mkdir -p tmp

custom_files="index.ts errors.ts cli.ts"

if [ ! -z "$custom_files" ]; then
  cp -f $custom_files tmp/.
fi

cp -rf src package.json package-lock.json deno.json tmp/.

cd tmp

grep -vEi 'errors.js|cli.js' index.ts >tmp.ts && mv tmp.ts index.ts

ln -sf ../node_modules node_modules

cli_name=$(jq -r '.name' package.json)

deno doc --html --name=$cli_name --output=docs index.ts cli.ts errors.ts

cd docs
mv index/~/* index/.
rmdir index/~

find . -type f -exec sed -i 's/index\/~/index/g' {} +
find . -type f -exec sed -i 's/index&#x2F;~/index/g' {} +

# npx http-server -c-1 -o=index.html
