#!/bin/bash
npx esbuild src/decode-webm.src.js \
  --bundle \
  --format=esm \
  --outfile=decode-webm.js \
  --platform=node \
  --alias:@eshaz/web-worker=../_build/empty-worker.js
