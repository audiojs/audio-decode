export interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

export interface StreamDecoder {
  /** Feed a chunk of encoded audio data. */
  decode(chunk: Uint8Array): Promise<AudioData>;
  /** Flush remaining buffered data and free resources. */
  decode(): Promise<AudioData>;
  /** Flush without freeing. */
  flush(): Promise<AudioData>;
  /** Free resources without flushing. */
  free(): void;
}

type Format = 'mp3' | 'flac' | 'opus' | 'oga' | 'm4a' | 'wav' | 'qoa' | 'aac' | 'aiff' | 'caf' | 'webm' | 'amr' | 'wma';

interface FormatDecoder {
  /** Whole-file decode for this format. */
  (src: ArrayBuffer | Uint8Array): Promise<AudioData>;
  /** Create a streaming decoder. */
  stream(): Promise<StreamDecoder>;
}

/** Whole-file decode: auto-detects format. */
declare function decode(buf: ArrayBuffer | Uint8Array): Promise<AudioData>;

declare namespace decode {
  export const mp3: FormatDecoder;
  export const flac: FormatDecoder;
  export const opus: FormatDecoder;
  export const oga: FormatDecoder;
  export const m4a: FormatDecoder;
  export const wav: FormatDecoder;
  export const qoa: FormatDecoder;
  export const aac: FormatDecoder;
  export const aiff: FormatDecoder;
  export const caf: FormatDecoder;
  export const webm: FormatDecoder;
  export const amr: FormatDecoder;
  export const wma: FormatDecoder;
}

export default decode;

/** @deprecated Use decode.mp3.stream() */
export function decodeStream(
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
  format: Format
): AsyncGenerator<AudioData>;

/** @deprecated Use decode.mp3, decode.flac, etc. */
export declare const decoders: typeof decode;
