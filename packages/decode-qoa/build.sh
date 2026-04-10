#!/bin/bash
set -e
cd "$(dirname "$0")"
npx esbuild src/decode-qoa.src.js --bundle --format=esm --outfile=decode-qoa.js --platform=neutral --main-fields=module,main
