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
  format: 'mp3' | 'flac' | 'opus' | 'oga' | 'wav' | 'qoa'
): AsyncGenerator<AudioData>;

export declare const decoders: {
  mp3(): Promise<StreamDecoder>;
  flac(): Promise<StreamDecoder>;
  opus(): Promise<StreamDecoder>;
  oga(): Promise<StreamDecoder>;
  wav(): Promise<StreamDecoder>;
  qoa(): Promise<StreamDecoder>;
};
