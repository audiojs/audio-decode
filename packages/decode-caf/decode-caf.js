/**
 * CAF (Core Audio Format) decoder
 * Decodes CAF containers with lpcm, alaw, ulaw audio to Float32 PCM
 *
 * let { channelData, sampleRate } = await decode(cafbuf)
 */

const EMPTY = Object.freeze({ channelData: [], sampleRate: 0 })

/**
 * Whole-file decode
 * @param {Uint8Array|ArrayBuffer} src
 * @returns {Promise<{channelData: Float32Array[], sampleRate: number}>}
 */
export default async function decode(src) {
	let dec = await decoder()
	try { return dec.decode(src) }
	finally { dec.free() }
}

/**
 * Create decoder instance
 * @returns {Promise<{decode(chunk: Uint8Array): {channelData, sampleRate}, flush(), free()}>}
 */
export async function decoder() {
	return new CAFDecoder()
}

class CAFDecoder {
	constructor() { this.done = false }

	decode(data) {
		if (this.done) throw Error('Decoder already freed')
		if (!data || !data.byteLength) return EMPTY

		let buf = data instanceof Uint8Array ? data : new Uint8Array(data)
		if (buf.length < 8) return EMPTY

		return decodeCAF(buf)
	}

	flush() { return EMPTY }

	free() { this.done = true }
}

function decodeCAF(buf) {
	let dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

	// File header: 'caff'(4) + version(2) + flags(2)
	if (buf[0] !== 0x63 || buf[1] !== 0x61 || buf[2] !== 0x66 || buf[3] !== 0x66) throw Error('Not a CAF file')
	if (dv.getUint16(4, false) !== 1) throw Error('Unsupported CAF version')

	let off = 8, desc = null, dataStart = -1, dataLen = -1

	// Parse chunks
	while (off + 12 <= buf.length) {
		let type = String.fromCharCode(buf[off], buf[off + 1], buf[off + 2], buf[off + 3])
		// size is int64 BE — read high/low 32
		let sizeHi = dv.getUint32(off + 4, false)
		let sizeLo = dv.getUint32(off + 8, false)
		let size = sizeHi * 0x100000000 + sizeLo
		off += 12

		if (type === 'desc' && off + 32 <= buf.length) {
			desc = {
				sampleRate: dv.getFloat64(off, false),
				formatID: String.fromCharCode(buf[off + 8], buf[off + 9], buf[off + 10], buf[off + 11]),
				formatFlags: dv.getUint32(off + 12, false),
				bytesPerPacket: dv.getUint32(off + 16, false),
				framesPerPacket: dv.getUint32(off + 20, false),
				channelsPerFrame: dv.getUint32(off + 24, false),
				bitsPerChannel: dv.getUint32(off + 28, false)
			}
		} else if (type === 'data') {
			// skip 4-byte editCount
			dataStart = off + 4
			// size -1 (0xFFFFFFFFFFFFFFFF) means rest of file
			dataLen = (sizeHi === 0xFFFFFFFF && sizeLo === 0xFFFFFFFF) ? buf.length - dataStart : size - 4
		}

		if (size < 0) break
		// -1 size: skip to end
		if (sizeHi === 0xFFFFFFFF && sizeLo === 0xFFFFFFFF) break
		off += size
	}

	if (!desc) throw Error('CAF: missing desc chunk')
	if (dataStart < 0) throw Error('CAF: missing data chunk')
	if (!desc.channelsPerFrame) throw Error('CAF: 0 channels')
	if (!desc.sampleRate) throw Error('CAF: 0 sample rate')

	let audioEnd = Math.min(dataStart + dataLen, buf.length)
	let audioData = buf.subarray(dataStart, audioEnd)

	let { formatID, formatFlags, channelsPerFrame: ch, bitsPerChannel: bits, sampleRate } = desc

	let samples
	if (formatID === 'lpcm') samples = decodeLPCM(audioData, formatFlags, bits, ch)
	else if (formatID === 'alaw') samples = decodeAlaw(audioData, ch)
	else if (formatID === 'ulaw') samples = decodeUlaw(audioData, ch)
	else throw Error('CAF: unsupported format ' + formatID)

	return { channelData: samples, sampleRate }
}

function decodeLPCM(data, flags, bits, ch) {
	let isFloat = flags & 1, isLE = flags & 2
	let bytesPerSample = bits >> 3
	let totalSamples = (data.length / bytesPerSample) | 0
	let framesCount = (totalSamples / ch) | 0
	if (!framesCount) return []

	let dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
	let channelData = Array.from({ length: ch }, () => new Float32Array(framesCount))

	if (isFloat && bits === 32) {
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off += 4)
				channelData[c][i] = dv.getFloat32(off, !!isLE)
	} else if (isFloat && bits === 64) {
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off += 8)
				channelData[c][i] = dv.getFloat64(off, !!isLE)
	} else if (bits === 32) {
		let norm = 1 / 2147483648
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off += 4)
				channelData[c][i] = dv.getInt32(off, !!isLE) * norm
	} else if (bits === 24) {
		let norm = 1 / 8388608
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off += 3) {
				let s
				if (!isLE) s = (data[off] << 16) | (data[off + 1] << 8) | data[off + 2]
				else s = data[off] | (data[off + 1] << 8) | (data[off + 2] << 16)
				if (s & 0x800000) s |= ~0xFFFFFF
				channelData[c][i] = s * norm
			}
	} else if (bits === 16) {
		let norm = 1 / 32768
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off += 2)
				channelData[c][i] = dv.getInt16(off, !!isLE) * norm
	} else if (bits === 8) {
		let norm = 1 / 128
		for (let i = 0, off = 0; i < framesCount; i++)
			for (let c = 0; c < ch; c++, off++)
				channelData[c][i] = dv.getInt8(off) * norm
	} else {
		throw Error('CAF: unsupported LPCM bit depth ' + bits)
	}

	return channelData
}

function alawDecode(val) {
	val ^= 0x55
	let sign = val & 0x80, seg = (val >> 4) & 7, quant = val & 0x0F
	let sample = seg ? ((quant << 1) | 0x21) << (seg - 1) : (quant << 1) | 1
	return (sign ? -sample : sample) / 32768
}

function ulawDecode(val) {
	val = ~val & 0xFF
	let sign = val & 0x80, exp = (val >> 4) & 7, mant = val & 0x0F
	let sample = ((mant << 1) | 0x21) << exp
	return (sign ? -(sample - 33) : (sample - 33)) / 32768
}

function decodeAlaw(data, ch) {
	let framesCount = (data.length / ch) | 0
	if (!framesCount) return []
	let channelData = Array.from({ length: ch }, () => new Float32Array(framesCount))
	for (let i = 0, off = 0; i < framesCount; i++)
		for (let c = 0; c < ch; c++, off++)
			channelData[c][i] = alawDecode(data[off])
	return channelData
}

function decodeUlaw(data, ch) {
	let framesCount = (data.length / ch) | 0
	if (!framesCount) return []
	let channelData = Array.from({ length: ch }, () => new Float32Array(framesCount))
	for (let i = 0, off = 0; i < framesCount; i++)
		for (let c = 0; c < ch; c++, off++)
			channelData[c][i] = ulawDecode(data[off])
	return channelData
}
