interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface AIFFDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Decode AIFF/AIFF-C audio buffer to PCM samples */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create decoder instance */
export function decoder(): Promise<AIFFDecoder>;
