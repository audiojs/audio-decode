interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface AMRDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Whole-file decode — auto-detects AMR-NB vs AMR-WB */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create decoder instance */
export function decoder(): Promise<AMRDecoder>;
