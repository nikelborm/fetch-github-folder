#!/usr/bin/env bash
set -euo pipefail

# If you use vscode's live server plugin, it's better to leave this disabled
# rm -rf tmp

mkdir -p tmp

cp -rf index.ts errors.ts cli.ts src package.json package-lock.json deno.json tmp/.

cd tmp

find src index.ts cli.ts errors.ts -type f -exec sed -i "s/.js';/.ts';/g" {} +

ln -sf ../node_modules node_modules

deno doc --html --name=fetch-github-folder --output=docs index.ts cli.ts errors.ts

cd docs
mv index/~/* index/.
rmdir index/~

find . -type f -exec sed -i 's/index\/~/index/g' {} +
find . -type f -exec sed -i 's/index&#x2F;~/index/g' {} +

# npx http-server -c-1 -o=index.html
