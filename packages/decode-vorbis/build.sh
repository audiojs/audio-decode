#!/bin/bash
set -e
cd "$(dirname "$0")"
npx esbuild src/decode-vorbis.src.js --bundle --format=esm --outfile=decode-vorbis.js --platform=node --alias:@eshaz/web-worker=../_build/empty-worker.js
