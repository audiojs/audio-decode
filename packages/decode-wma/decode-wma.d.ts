interface AudioData {
  channelData: Float32Array[];
  sampleRate: number;
}

interface WmaDecoder {
  decode(data: Uint8Array): AudioData;
  flush(): AudioData;
  free(): void;
}

/** Decode WMA audio buffer to PCM samples */
export default function decode(src: ArrayBuffer | Uint8Array): Promise<AudioData>;

/** Create streaming decoder instance */
export function decoder(): Promise<WmaDecoder>;

/** Parse ASF data packet, extract compressed audio payloads */
export function parsePacket(pkt: Uint8Array, packetSize: number): Uint8Array[];

/** Parse ASF container, extract audio properties and raw packets */
export function demuxASF(buf: Uint8Array): {
  channels: number;
  sampleRate: number;
  bitRate: number;
  blockAlign: number;
  bitsPerSample: number;
  formatTag: number;
  codecData: Uint8Array | null;
  duration: number;
  packetSize: number;
  packets: Uint8Array[];
};
