export interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

export interface StreamDecoder {
  /** Feed a chunk of encoded audio data. */
  decode(chunk: Uint8Array): Promise<AudioData>;
  /** Flush remaining buffered data and free resources. */
  decode(): Promise<AudioData>;
  /** Free resources without flushing. */
  free(): void;
}

/** Whole-file decode: auto-detects format. */
export default function decode(buf: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Decode a ReadableStream of audio chunks. */
export function decodeStream(
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  format: 'mp3' | 'flac' | 'opus' | 'oga' | 'm4a' | 'wav' | 'qoa' | 'aac' | 'aiff' | 'caf' | 'webm' | 'amr' | 'wma'
): AsyncGenerator<AudioData>;

export declare const decoders: {
  mp3(): Promise<StreamDecoder>;
  flac(): Promise<StreamDecoder>;
  opus(): Promise<StreamDecoder>;
  oga(): Promise<StreamDecoder>;
  m4a(): Promise<StreamDecoder>;
  wav(): Promise<StreamDecoder>;
  qoa(): Promise<StreamDecoder>;
  aac(): Promise<StreamDecoder>;
  aiff(): Promise<StreamDecoder>;
  caf(): Promise<StreamDecoder>;
  webm(): Promise<StreamDecoder>;
  amr(): Promise<StreamDecoder>;
  wma(): Promise<StreamDecoder>;
};
