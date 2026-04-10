#!/bin/bash
set -e
cd "$(dirname "$0")"
npx esbuild src/decode-mp3.src.js --bundle --format=esm --outfile=decode-mp3.js --platform=node --alias:@eshaz/web-worker=../_build/empty-worker.js
