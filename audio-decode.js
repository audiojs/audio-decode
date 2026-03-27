/**
 * Audio decoder: whole-file and streaming
 * @module audio-decode
 *
 * let { channelData, sampleRate } = await decode(buf)
 *
 * let dec = await decode.mp3()
 * let { channelData, sampleRate } = await dec(chunk)
 * await dec() // close
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
	if (!decode[type]) throw Error('No decoder for ' + type)

	let dec = await decode[type]()
	try {
		let result = await dec(buf)
		let flushed = await dec()
		return merge(result, flushed)
	} catch (e) { dec.free(); throw e }
}

/**
 * Decode a ReadableStream or async iterable of audio chunks
 * @param {ReadableStream|AsyncIterable} stream
 * @param {string} format - codec name
 * @returns {AsyncGenerator<{channelData: Float32Array[], sampleRate: number}>}
 */
export async function* decodeStream(stream, format) {
	if (!decode[format]) throw Error('No decoder for ' + format)
	let dec = await decode[format]()
	try {
		// Safari ReadableStream doesn't support for-await, use getReader() if available
		if (stream.getReader) {
			let reader = stream.getReader()
			while (true) {
				let { done, value } = await reader.read()
				if (done) break
				let result = await dec(value instanceof Uint8Array ? value : new Uint8Array(value))
				if (result.channelData.length) yield result
			}
		} else {
			for await (let chunk of stream) {
				let result = await dec(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk))
				if (result.channelData.length) yield result
			}
		}
		let flushed = await dec()
		if (flushed.channelData.length) yield flushed
	} finally {
		dec.free()
	}
}

// --- format registration ---

function reg(name, load) {
	decode[name] = fmt(name, async () => {
		let mod = await load()
		// @audio/* packages export { decoder, default }
		if (mod.decoder) {
			let codec = await mod.decoder()
			return streamDecoder(
				chunk => codec.decode(chunk),
				codec.flush ? () => codec.flush() : null,
				codec.free ? () => codec.free() : null
			)
		}
		// wasm-audio-decoders export class with .ready
		let init = mod.default || mod
		let codec = typeof init === 'function' ? await init() : init
		if (codec.ready) await codec.ready
		return streamDecoder(
			chunk => codec.decode(chunk),
			codec.flush ? () => codec.flush() : null,
			codec.free ? () => codec.free() : null
		)
	})
}

// TODO: remove backward compat (src arg, .stream) in next major
function fmt(name, init) {
	let fn = async (src) => {
		if (!src) return init()
		console.warn('decode.' + name + '(data) is deprecated, use decode(data) or let dec = await decode.' + name + '()')
		let dec = await init()
		try {
			let result = await dec(src instanceof Uint8Array ? src : new Uint8Array(src.buffer || src))
			let flushed = await dec()
			return merge(result, flushed)
		} catch (e) { dec.free(); throw e }
	}
	fn.stream = init
	return fn
}

// --- codecs ---

reg('mp3', () => import('mpg123-decoder').then(m => ({ decoder: async () => { let d = new m.MPEGDecoder(); await d.ready; return d } })))
reg('flac', () => import('@wasm-audio-decoders/flac').then(m => ({ decoder: async () => { let d = new m.FLACDecoder(); await d.ready; return d } })))
reg('opus', () => import('ogg-opus-decoder').then(m => ({ decoder: async () => { let d = new m.OggOpusDecoder(); await d.ready; return d } })))
reg('oga', () => import('@wasm-audio-decoders/ogg-vorbis').then(m => ({ decoder: async () => { let d = new m.OggVorbisDecoder(); await d.ready; return d } })))

// M4A needs full file (moov atom can be at end) — buffer chunks until flush
decode.m4a = fmt('m4a', async () => {
	const { decoder } = await import('@audio/aac-decode')
	let dec = await decoder()
	let chunks = [], decoded = false
	return streamDecoder(
		chunk => {
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
})

reg('wav', () => import('@audio/wav-decode'))
reg('qoa', () => import('qoa-format').then(m => ({ decoder: async () => ({ decode: chunk => m.decode(chunk) }) })))

reg('aac', () => import('@audio/aac-decode'))
reg('aiff', () => import('@audio/aiff-decode'))
reg('caf', () => import('@audio/caf-decode'))
reg('webm', () => import('@audio/webm-decode'))
reg('amr', () => import('@audio/amr-decode'))
reg('wma', () => import('@audio/wma-decode'))

// TODO: remove in next major
export const decoders = decode

/**
 * StreamDecoder — a callable function:
 * dec(chunk)  — decode data, returns { channelData, sampleRate }
 * dec()       — end of stream: flush remaining samples + free resources
 * dec.flush() — flush without freeing
 * dec.free()  — release resources without flushing
 */
function streamDecoder(onDecode, onFlush, onFree) {
	let done = false
	let fn = async (chunk) => {
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
	}
	fn.decode = fn // TODO: remove in next major
	fn.flush = async () => {
		if (done) return EMPTY
		return onFlush ? norm(await onFlush()) : EMPTY
	}
	fn.free = () => {
		if (done) return
		done = true
		onFree?.()
	}
	return fn
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
