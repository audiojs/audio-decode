import type { AudioData } from './audio-decode.js';

type Format = 'mp3' | 'flac' | 'opus' | 'oga' | 'm4a' | 'wav' | 'qoa' | 'aac' | 'aiff' | 'caf' | 'webm' | 'amr' | 'wma';

/** Decode a stream of audio chunks */
declare function decodeStream(
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  format: Format
): AsyncGenerator<AudioData>;

export default decodeStream;
export { decodeStream };
