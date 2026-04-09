import type { AudioData } from './audio-decode.js';

type Format = 'mp3' | 'flac' | 'opus' | 'oga' | 'm4a' | 'wav' | 'qoa' | 'aac' | 'aiff' | 'caf' | 'webm' | 'amr' | 'wma';

/** Chunked decode from stream or async iterable. */
declare function decodeChunked(
  source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  format: Format
): AsyncGenerator<AudioData>;

export default decodeChunked;
export { decodeChunked };

export default decodeStream;
export { decodeStream };
