#!/bin/bash
# Build RockBox fixed-point WMA decoder -> wma.wasm
#
# Uses xOpenLee/wmaDecode standalone extraction of RockBox's WMA decoder.
# Only supports WMAv1 (0x0160) and WMAv2 (0x0161) — no Pro/Lossless.
# For FFmpeg build (Pro/Lossless support), use build-ffmpeg.sh.
set -e

# Find python 3.10+ for emscripten
if [ -z "$EMSDK_PYTHON" ]; then
  for py in python3.14 python3.13 python3.12 python3.11 python3.10 python3; do
    ver=$($py -c 'import sys;print(sys.version_info[1])' 2>/dev/null)
    if [ -n "$ver" ] && [ "$ver" -ge 10 ]; then
      export EMSDK_PYTHON=$(which $py)
      break
    fi
  done
fi

OUT=src/wma.wasm

# Patch wmadeci.c typedefs that conflict with stdint.h (char vs signed char)
PATCHED=src/_wmadeci_patched.c
sed 's/^typedef .*int[0-9]*_t;//' lib/rockbox-wma/wmadeci.c > "$PATCHED"
trap "rm -f $PATCHED" EXIT

echo "Compiling RockBox WMA WASM module..."
emcc \
  src/wma_glue.c \
  -I lib/rockbox-wma \
  -Wno-typedef-redefinition \
  -O3 \
  -flto \
  -s WASM=1 \
  -s STANDALONE_WASM=0 \
  -s EXPORTED_FUNCTIONS='[
    "_wma_create","_wma_decode","_wma_close",
    "_wma_samples","_wma_channels","_wma_samplerate",
    "_wma_free_buf",
    "_malloc","_free"
  ]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAPU8","HEAPF32","getValue"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=4194304 \
  -s MAXIMUM_MEMORY=134217728 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=createWMA \
  -s ENVIRONMENT='web,node' \
  -s FILESYSTEM=0 \
  -s ASSERTIONS=0 \
  -s MALLOC=emmalloc \
  -s SINGLE_FILE=1 \
  --no-entry \
  -o $OUT.cjs

# Avoid a static node:fs require so browser bundlers don't try to resolve it
perl -0pi -e 's/var fs=require\("node:fs"\);/var _nfs="node:"+"fs";var fs=require(_nfs);/' $OUT.cjs

# Append CJS export
echo "if(typeof module!=='undefined')module.exports=createWMA;" >> $OUT.cjs

echo "Built: $(wc -c < $OUT.cjs) bytes"
