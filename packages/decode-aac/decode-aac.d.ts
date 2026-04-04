interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface AACDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Whole-file decode — auto-detects M4A vs ADTS */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create streaming decoder instance */
export function decoder(): Promise<AACDecoder>;
