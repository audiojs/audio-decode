## Missing codecs

- [x] aiff decoder → @audiojs/aiff-decode (pure JS)
- [x] aac (raw ADTS) decoder → wired via aac-decode (already supported)
- [x] wma decoder → @audiojs/wma-decode (ASF demuxer done, WASM needs FFmpeg clone)
- [x] amr decoder → @audiojs/amr-decode (WASM via opencore-amr, fully working)
- [x] webm audio decoder → @audiojs/webm-decode (EBML demuxer + opus-decoder)
- [x] caf decoder → @audiojs/caf-decode (pure JS)
