interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface OpusDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Whole-file Ogg Opus decode */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create streaming decoder instance */
export function decoder(): Promise<OpusDecoder>;
