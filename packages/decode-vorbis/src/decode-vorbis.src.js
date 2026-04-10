/**
 * Ogg Vorbis decoder — libvorbis compiled to WASM
 * @module @audio/decode-vorbis
 */
import { OggVorbisDecoder } from '@wasm-audio-decoders/ogg-vorbis'

const EMPTY = Object.freeze({ channelData: Object.freeze([]), sampleRate: 0 })

export default async function decode(src) {
	let buf = src instanceof Uint8Array ? src : new Uint8Array(src)
	let dec = await decoder()
	try {
		let a = await dec.decode(buf)
		let b = dec.flush ? await dec.flush() : null
		return b?.channelData?.length ? merge(a, b) : a
	} finally { dec.free() }
}

export async function decoder() {
	let d = new OggVorbisDecoder()
	await d.ready
	return d
}

function merge(a, b) {
	if (!b?.channelData?.length) return a
	if (!a?.channelData?.length) return b
	return {
		channelData: a.channelData.map((ch, i) => {
			let bc = b.channelData[i] || b.channelData[0]
			let m = new Float32Array(ch.length + bc.length)
			m.set(ch); m.set(bc, ch.length)
			return m
		}),
		sampleRate: a.sampleRate
	}
}
