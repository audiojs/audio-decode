#!/bin/bash
set -e
cd "$(dirname "$0")"
npx esbuild src/decode-flac.src.js --bundle --format=esm --outfile=decode-flac.js --platform=node --alias:@eshaz/web-worker=../_build/empty-worker.js
