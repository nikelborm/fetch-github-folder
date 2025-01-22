#!/usr/bin/env bash
set -euo pipefail

rm -rf tmp

mkdir -p tmp

cp -r index.ts errors.ts cli.ts src package.json package-lock.json deno.json tmp/.

cd tmp

find src index.ts cli.ts errors.ts -type f -exec sed -i "s/.js';/.ts';/g" {} +

ln -s ../node_modules node_modules
deno doc --html --output=docs index.ts errors.ts cli.ts
