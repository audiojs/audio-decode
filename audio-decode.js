/**
 * Audio decoder: whole-file and streaming
 * @module audio-decode
 *
 * let { channelData, sampleRate } = await decode(mp3buf)
 *
 * let dec = await decoders.mp3()
 * let { channelData, sampleRate } = await dec.decode(chunk)
 * await dec.decode() // flush + free
 */

import getType from 'audio-type';

const EMPTY = Object.freeze({ channelData: Object.freeze([]), sampleRate: 0 })

/**
 * Whole-file decode: auto-detects format
 * @param {ArrayBuffer|Uint8Array} src - encoded audio data
 * @returns {Promise<{channelData: Float32Array[], sampleRate: number}>}
 */
export default async function decode(src) {
	if (!src || typeof src === 'string' || !(src.buffer || src.byteLength || src.length))
		throw TypeError('Expected ArrayBuffer or Uint8Array')
	let buf = new Uint8Array(src.buffer || src)

	let type = getType(buf)
	if (!type) throw Error('Unknown audio format')
	if (!decoders[type]) throw Error('No decoder for ' + type)

	let dec = await decoders[type]()
	try {
		let result = await dec.decode(buf)
		let flushed = await dec.decode()
		return merge(result, flushed)
	} catch (e) {
		dec.free()
		throw e
	}
}

/**
 * Decode a ReadableStream of audio chunks
 * @param {ReadableStream} stream - stream of Uint8Array chunks
 * @param {string} format - codec name (mp3, flac, opus, oga, m4a, wav, qoa, aac, aiff, caf, webm, amr, wma)
 * @returns {AsyncGenerator<{channelData: Float32Array[], sampleRate: number}>}
 */
export async function* decodeStream(stream, format) {
	if (!decoders[format]) throw Error('No decoder for ' + format)
	let dec = await decoders[format]()
	try {
		// Safari ReadableStream doesn't support for-await, use getReader() if available
		if (stream.getReader) {
			let reader = stream.getReader()
			while (true) {
				let { done, value } = await reader.read()
				if (done) break
				let result = await dec.decode(value instanceof Uint8Array ? value : new Uint8Array(value))
				if (result.channelData.length) yield result
			}
		} else {
			for await (let chunk of stream) {
				let result = await dec.decode(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk))
				if (result.channelData.length) yield result
			}
		}
		let flushed = await dec.decode()
		if (flushed.channelData.length) yield flushed
	} finally {
		dec.free()
	}
}

// codec registry: each returns an initialized StreamDecoder
export const decoders = {
	async mp3() {
		const { MPEGDecoder } = await import('mpg123-decoder')
		let dec = new MPEGDecoder()
		await dec.ready
		return streamDecoder(chunk => dec.decode(chunk), null, () => dec.free())
	},

	async flac() {
		const { FLACDecoder } = await import('@wasm-audio-decoders/flac')
		let dec = new FLACDecoder()
		await dec.ready
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async opus() {
		const { OggOpusDecoder } = await import('ogg-opus-decoder')
		let dec = new OggOpusDecoder()
		await dec.ready
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async oga() {
		const { OggVorbisDecoder } = await import('@wasm-audio-decoders/ogg-vorbis')
		let dec = new OggVorbisDecoder()
		await dec.ready
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async m4a() {
		const { decoder } = await import('@audio/aac-decode')
		let dec = await decoder()
		// M4A requires full file (moov atom can be at end), so buffer chunks until flush
		let chunks = [], decoded = false
		return streamDecoder(
			chunk => {
				// if chunk contains ftyp, try decoding as complete M4A
				if (!decoded && chunk.length > 8 && chunk[4] === 0x66 && chunk[5] === 0x74 && chunk[6] === 0x79 && chunk[7] === 0x70) {
					let r = dec.decode(chunk)
					if (r.channelData.length) { decoded = true; chunks = null; return r }
				}
				if (!decoded) chunks.push(chunk)
				return EMPTY
			},
			() => {
				if (decoded || !chunks.length) return EMPTY
				let total = chunks.reduce((a, c) => a + c.length, 0)
				let buf = new Uint8Array(total), off = 0
				for (let c of chunks) { buf.set(c, off); off += c.length }
				chunks = null
				return dec.decode(buf)
			},
			() => { chunks = null; dec.free() }
		)
	},

	async wav() {
		let { default: { decode: wavDecode } } = await import('node-wav')
		return streamDecoder(chunk => wavDecode(chunk))
	},

	async qoa() {
		let { decode } = await import('qoa-format')
		return streamDecoder(chunk => decode(chunk))
	},

	async aac() {
		const { decoder } = await import('@audio/aac-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async aiff() {
		const { decoder } = await import('@audio/aiff-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async caf() {
		const { decoder } = await import('@audio/caf-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async webm() {
		const { decoder } = await import('@audio/webm-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async amr() {
		const { decoder } = await import('@audio/amr-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},

	async wma() {
		const { decoder } = await import('@audio/wma-decode')
		let dec = await decoder()
		return streamDecoder(chunk => dec.decode(chunk), () => dec.flush(), () => dec.free())
	},
}

/**
 * StreamDecoder:
 * .decode(chunk) — decode data, returns { channelData, sampleRate }
 * .decode(null)  — end of stream: flush remaining samples + free resources
 * .free()        — release resources without flushing
 */
function streamDecoder(onDecode, onFlush, onFree) {
	let done = false
	return {
		async decode(chunk) {
			if (chunk) {
				if (done) throw Error('Decoder already freed')
				try { return norm(await onDecode(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk))) }
				catch (e) { done = true; onFree?.(); throw e }
			}
			// null/undefined = end of stream
			if (done) return EMPTY
			done = true
			try {
				let result = onFlush ? norm(await onFlush()) : EMPTY
				onFree?.()
				return result
			} catch (e) { onFree?.(); throw e }
		},
		async flush() {
			if (done) return EMPTY
			return onFlush ? norm(await onFlush()) : EMPTY
		},
		free() {
			if (done) return
			done = true
			onFree?.()
		}
	}
}

// extract { channelData, sampleRate } from codec result
function norm(r) {
	if (!r?.channelData?.length) return EMPTY
	let { channelData, sampleRate, samplesDecoded } = r
	if (samplesDecoded != null && samplesDecoded < channelData[0].length)
		channelData = channelData.map(ch => ch.subarray(0, samplesDecoded))
	if (!channelData[0]?.length) return EMPTY
	return { channelData, sampleRate }
}

// merge two decode results
function merge(a, b) {
	if (!b?.channelData?.length) return a
	if (!a?.channelData?.length) return b
	return {
		channelData: a.channelData.map((ch, i) => {
			let merged = new Float32Array(ch.length + b.channelData[i].length)
			merged.set(ch)
			merged.set(b.channelData[i], ch.length)
			return merged
		}),
		sampleRate: a.sampleRate
	}
}
