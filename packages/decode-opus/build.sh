#!/bin/bash
set -e
cd "$(dirname "$0")"
npx esbuild src/decode-opus.src.js --bundle --format=esm --outfile=decode-opus.js --platform=node --alias:@eshaz/web-worker=../_build/empty-worker.js --external:@wasm-audio-decoders/opus-ml
