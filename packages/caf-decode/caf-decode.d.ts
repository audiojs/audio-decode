interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface CAFDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Whole-file decode of CAF audio */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create decoder instance */
export function decoder(): Promise<CAFDecoder>;
