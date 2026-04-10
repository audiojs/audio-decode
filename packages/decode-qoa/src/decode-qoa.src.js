/**
 * QOA decoder — Quite OK Audio format
 * @module @audio/decode-qoa
 */
import qoaDecode from 'qoa-format/decode.js'

export default async function decode(src) {
	let buf = src instanceof Uint8Array ? src : new Uint8Array(src)
	return qoaDecode(buf)
}

export async function decoder() {
	return {
		decode: chunk => qoaDecode(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)),
		flush: () => ({ channelData: [], sampleRate: 0 }),
		free: () => {}
	}
}
