interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface WebmDecoder {
  decode(data: Uint8Array): Promise<AudioData>;
  flush(): Promise<AudioData>;
  free(): void;
}

/** Decode WebM audio buffer (Opus, Vorbis) to PCM samples */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create streaming decoder instance */
export function decoder(): Promise<WebmDecoder>;
