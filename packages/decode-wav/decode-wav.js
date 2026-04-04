/**
 * WAV decoder — pure JS / ESM
 * Decodes PCM WAV audio to Float32Array samples (8/16/24/32-bit int, 32/64-bit float)
 *
 * let { channelData, sampleRate } = await decode(wavbuf)
 */

const EMPTY = Object.freeze({ channelData: [], sampleRate: 0 })

const decoders = {
	pcm8(buf, off, ch, frames, nCh) {
		let src = new Uint8Array(buf, off)
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) {
				let v = src[p++] - 128
				ch[c][i] = v < 0 ? v / 128 : v / 127
			}
	},
	pcm16(buf, off, ch, frames, nCh) {
		let src = new Int16Array(buf, off)
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) {
				let v = src[p++]
				ch[c][i] = v < 0 ? v / 32768 : v / 32767
			}
	},
	pcm24(buf, off, ch, frames, nCh) {
		let src = new Uint8Array(buf, off)
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) {
				let v = src[p] | (src[p + 1] << 8) | (src[p + 2] << 16); p += 3
				if (v >= 0x800000) v -= 0x1000000
				ch[c][i] = v < 0 ? v / 8388608 : v / 8388607
			}
	},
	pcm32(buf, off, ch, frames, nCh) {
		let src = new Int32Array(buf, off)
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) {
				let v = src[p++]
				ch[c][i] = v < 0 ? v / 2147483648 : v / 2147483647
			}
	},
	pcm32f(buf, off, ch, frames, nCh) {
		let src = new Float32Array(buf, off)
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) ch[c][i] = src[p++]
	},
	pcm64f(buf, off, ch, frames, nCh) {
		// slice to ensure 8-byte alignment (WAV data offset may not be aligned)
		let src = new Float64Array(buf.slice(off, off + frames * nCh * 8))
		for (let i = 0, p = 0; i < frames; i++)
			for (let c = 0; c < nCh; c++) ch[c][i] = src[p++]
	},
}

function parseWav(data) {
	let buf = data instanceof Uint8Array ? data.buffer : data
	let off = data instanceof Uint8Array ? data.byteOffset : 0
	let end = off + (data instanceof Uint8Array ? data.byteLength : data.byteLength)
	let v = new DataView(buf)
	let pos = off

	function u8()  { return v.getUint8(pos++) }
	function u16() { let x = v.getUint16(pos, true); pos += 2; return x }
	function u32() { let x = v.getUint32(pos, true); pos += 4; return x }
	function str(n) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(u8()); return s }

	if (str(4) !== 'RIFF') throw TypeError('Not a WAV file')
	u32() // file size
	if (str(4) !== 'WAVE') throw TypeError('Not a WAV file')

	let fmt
	while (pos < end) {
		let type = str(4), size = u32(), next = pos + size
		if (type === 'fmt ') {
			let formatId = u16()
			if (formatId !== 1 && formatId !== 3) throw TypeError('Unsupported WAV format: 0x' + formatId.toString(16))
			fmt = {
				float: formatId === 3,
				channels: u16(),
				sampleRate: u32(),
				byteRate: u32(),
				blockSize: u16(),
				bitDepth: u16(),
			}
		} else if (type === 'data') {
			if (!fmt) throw TypeError('Missing fmt chunk')
			let frames = Math.floor(size / fmt.blockSize)
			let ch = Array.from({ length: fmt.channels }, () => new Float32Array(frames))
			let key = 'pcm' + fmt.bitDepth + (fmt.float ? 'f' : '')
			let dec = decoders[key]
			if (!dec) throw TypeError('Unsupported WAV bit depth: ' + fmt.bitDepth)
			dec(buf, pos, ch, frames, fmt.channels)
			return { channelData: ch, sampleRate: fmt.sampleRate }
		}
		pos = next
	}

	return EMPTY
}

export default async function decode(src) {
	let dec = await decoder()
	try { return dec.decode(src instanceof Uint8Array ? src : new Uint8Array(src)) }
	finally { dec.free() }
}

export async function decoder() {
	let freed = false
	return {
		decode(data) {
			if (freed) throw Error('Decoder already freed')
			if (!data?.length) return EMPTY
			return parseWav(data)
		},
		flush() { return EMPTY },
		free() { freed = true },
	}
}
