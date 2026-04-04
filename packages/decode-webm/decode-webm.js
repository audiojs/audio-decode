/**
 * WebM audio decoder — demuxes EBML, decodes Opus/Vorbis to PCM
 *
 * let { channelData, sampleRate } = await decode(webmbuf)
 * let dec = await decoder(); let result = await dec.decode(chunk)
 */

const EMPTY = Object.freeze({ channelData: [], sampleRate: 0 })

// EBML element IDs
const ID_EBML = 0x1A45DFA3
const ID_SEGMENT = 0x18538067
const ID_TRACKS = 0x1654AE6B
const ID_TRACK_ENTRY = 0xAE
const ID_TRACK_NUMBER = 0xD7
const ID_TRACK_TYPE = 0x83
const ID_CODEC_ID = 0x86
const ID_CODEC_PRIVATE = 0x63A2
const ID_AUDIO = 0xE1
const ID_SAMPLE_RATE = 0xB5
const ID_CHANNELS = 0x9F
const ID_CODEC_DELAY = 0x56AA
const ID_SEEK_PRE_ROLL = 0x56BB
const ID_CLUSTER = 0x1F43B675
const ID_SIMPLE_BLOCK = 0xA3
const ID_BLOCK_GROUP = 0xA0
const ID_BLOCK = 0xA1

// Master elements whose children we descend into
const MASTER = new Set([
	ID_EBML, ID_SEGMENT, ID_TRACKS, ID_AUDIO,
	ID_CLUSTER, ID_BLOCK_GROUP
])

// Unknown-size sentinel values per VINT length (all value bits = 1)
const UNKNOWN_SIZE = [0x7F, 0x3FFF, 0x1FFFFF, 0x0FFFFFFF, 0x07FFFFFFFF, 0x03FFFFFFFFFF, 0x01FFFFFFFFFFFF, 0x00FFFFFFFFFFFFFF]

/**
 * Read EBML element ID (VINT with leading 1 retained)
 */
function readId(b, o) {
	if (o >= b.length) return null
	let first = b[o], len = 1, mask = 0x80
	while (len <= 4 && !(first & mask)) { len++; mask >>= 1 }
	if (len > 4) return null
	let val = first
	for (let i = 1; i < len; i++) {
		if (o + i >= b.length) return null
		val = val * 256 + b[o + i]
	}
	return { val, len }
}

/**
 * Read EBML VINT data size (leading 1 masked off)
 * Returns -1 for unknown size
 */
function readSize(b, o) {
	if (o >= b.length) return null
	let first = b[o], len = 1, mask = 0x80
	while (len <= 8 && !(first & mask)) { len++; mask >>= 1 }
	if (len > 8) return null
	let val = first & (mask - 1)
	for (let i = 1; i < len; i++) {
		if (o + i >= b.length) return null
		val = val * 256 + b[o + i]
	}
	if (val === UNKNOWN_SIZE[len - 1]) return { val: -1, len }
	return { val, len }
}

function readUint(b, o, n) {
	let v = 0
	for (let i = 0; i < n; i++) v = v * 256 + b[o + i]
	return v
}

function readFloat(b, o, n) {
	let dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
	if (n === 4) return dv.getFloat32(o)
	if (n === 8) return dv.getFloat64(o)
	return 0
}

function readStr(b, o, n) {
	let s = ''
	for (let i = 0; i < n; i++) {
		if (b[o + i] === 0) break
		s += String.fromCharCode(b[o + i])
	}
	return s
}

/**
 * Parse Opus identification header (CodecPrivate in WebM)
 * RFC 7845: "OpusHead" + version + channels + preSkip(LE16) + sampleRate(LE32) + outputGain(LE16) + mappingFamily...
 */
function parseOpusHead(d) {
	if (!d || d.length < 19) return null
	if (readStr(d, 0, 8) !== 'OpusHead') return null
	if (d[8] > 15) return null // unknown major version

	let channels = d[9]
	let preSkip = d[10] | (d[11] << 8)
	let sampleRate = d[12] | (d[13] << 8) | (d[14] << 16) | (d[15] << 24)
	let mappingFamily = d[18]
	let streamCount = 1, coupledStreamCount = channels > 1 ? 1 : 0
	let channelMappingTable = channels === 1 ? [0] : [0, 1]

	if (mappingFamily > 0 && d.length >= 21 + channels) {
		streamCount = d[19]
		coupledStreamCount = d[20]
		channelMappingTable = Array.from(d.subarray(21, 21 + channels))
	}

	return { channels, preSkip, sampleRate, mappingFamily, streamCount, coupledStreamCount, channelMappingTable }
}

/**
 * Parse WebM EBML structure, extract first audio track info + raw codec frames
 */
function parseWebm(buf) {
	let b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
	if (b.length < 4) throw Error('Not a WebM file')

	let id = readId(b, 0)
	if (!id || id.val !== ID_EBML) throw Error('Not a WebM file')

	// Collect track entries, then pick the first audio track
	let entries = []    // each: { number, type, codec, sampleRate, channels, codecPrivate, codecDelay, seekPreRoll }
	let curEntry = null // current TrackEntry being parsed
	let audioTrack = null
	let frames = []

	function walk(start, end) {
		let pos = start
		while (pos < end) {
			let eid = readId(b, pos)
			if (!eid) break
			let siz = readSize(b, pos + eid.len)
			if (!siz) break

			let dataOff = pos + eid.len + siz.len
			let dataLen = siz.val
			let elemEnd = dataLen < 0 ? end : dataOff + dataLen
			if (elemEnd > end) elemEnd = end
			if (dataOff > end) break

			let elemId = eid.val

			if (elemId === ID_TRACK_ENTRY) {
				// Start a new track entry, then descend
				curEntry = { number: 0, type: 0, codec: '', sampleRate: 48000, channels: 2, codecPrivate: null, codecDelay: 0, seekPreRoll: 0 }
				walk(dataOff, elemEnd)
				entries.push(curEntry)
				// Pick first audio track
				if (!audioTrack && curEntry.type === 2 && curEntry.codec) audioTrack = curEntry
				curEntry = null
			} else if (MASTER.has(elemId)) {
				walk(dataOff, elemEnd)
			} else if (curEntry) {
				// Inside a TrackEntry
				if (elemId === ID_TRACK_NUMBER) curEntry.number = readUint(b, dataOff, dataLen)
				else if (elemId === ID_TRACK_TYPE) curEntry.type = readUint(b, dataOff, dataLen)
				else if (elemId === ID_CODEC_ID) curEntry.codec = readStr(b, dataOff, dataLen)
				else if (elemId === ID_CODEC_PRIVATE) curEntry.codecPrivate = b.slice(dataOff, dataOff + dataLen)
				else if (elemId === ID_SAMPLE_RATE && dataLen > 0) curEntry.sampleRate = readFloat(b, dataOff, dataLen)
				else if (elemId === ID_CHANNELS && dataLen > 0) curEntry.channels = readUint(b, dataOff, dataLen)
				else if (elemId === ID_CODEC_DELAY && dataLen > 0) curEntry.codecDelay = readUint(b, dataOff, dataLen)
				else if (elemId === ID_SEEK_PRE_ROLL && dataLen > 0) curEntry.seekPreRoll = readUint(b, dataOff, dataLen)
			} else if ((elemId === ID_SIMPLE_BLOCK || elemId === ID_BLOCK) && audioTrack && dataLen > 0) {
				let bp = dataOff
				let tn = readSize(b, bp)
				if (tn && tn.val === audioTrack.number) {
					bp += tn.len + 3 // skip track VINT + 2 bytes timestamp + 1 byte flags
					if (bp < dataOff + dataLen) {
						frames.push(b.subarray(bp, dataOff + dataLen))
					}
				}
			}

			pos = elemEnd
		}
	}

	walk(0, b.length)

	if (!audioTrack) throw Error('No audio track found in WebM')

	return {
		codec: audioTrack.codec,
		sampleRate: audioTrack.sampleRate,
		channels: audioTrack.channels,
		codecPrivate: audioTrack.codecPrivate,
		codecDelay: audioTrack.codecDelay,
		seekPreRoll: audioTrack.seekPreRoll,
		frames
	}
}

/**
 * Decode raw Opus frames via opus-decoder
 */
async function decodeOpus(info) {
	let { OpusDecoder } = await import('opus-decoder')

	let head = info.codecPrivate ? parseOpusHead(info.codecPrivate) : null
	let channels = head?.channels || info.channels || 2
	let preSkip = head?.preSkip || 0

	// CodecDelay in WebM is nanoseconds; convert to samples as fallback
	if (!preSkip && info.codecDelay) preSkip = Math.round(info.codecDelay / 1e9 * 48000)

	let opts = { channels, sampleRate: 48000, preSkip }

	if (head && head.mappingFamily > 0) {
		opts.streamCount = head.streamCount
		opts.coupledStreamCount = head.coupledStreamCount
		opts.channelMappingTable = head.channelMappingTable
	} else if (channels === 1) {
		opts.streamCount = 1
		opts.coupledStreamCount = 0
		opts.channelMappingTable = [0]
	} else if (channels === 2) {
		opts.streamCount = 1
		opts.coupledStreamCount = 1
		opts.channelMappingTable = [0, 1]
	}

	let dec = new OpusDecoder(opts)
	await dec.ready

	if (!info.frames.length) { dec.free(); return EMPTY }

	let result = dec.decodeFrames(info.frames)
	dec.free()

	if (!result?.channelData?.length) return EMPTY

	let { channelData, samplesDecoded, sampleRate } = result
	if (samplesDecoded != null && samplesDecoded < channelData[0].length)
		channelData = channelData.map(ch => ch.subarray(0, samplesDecoded))

	return { channelData, sampleRate }
}

/**
 * Parse Matroska Vorbis CodecPrivate into 3 header packets.
 * Format: byte 0 = num_packets-1 (2), then Xiph lacing sizes, then concatenated packets.
 */
function parseVorbisPrivate(d) {
	if (!d || d.length < 3 || d[0] !== 2) return null
	let pos = 1, sizes = []
	for (let i = 0; i < 2; i++) {
		let sz = 0
		while (pos < d.length && d[pos] === 255) { sz += 255; pos++ }
		if (pos < d.length) { sz += d[pos]; pos++ }
		sizes.push(sz)
	}
	let h1 = d.slice(pos, pos + sizes[0])
	let h2 = d.slice(pos + sizes[0], pos + sizes[0] + sizes[1])
	let h3 = d.slice(pos + sizes[0] + sizes[1])
	if (h1[0] !== 1 || h2[0] !== 3 || h3[0] !== 5) return null
	return [h1, h2, h3]
}

// OGG CRC lookup table (polynomial 0x04C11DB7)
const OGG_CRC = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
	let r = i << 24
	for (let j = 0; j < 8; j++) r = (r << 1) ^ ((r >>> 31) * 0x04C11DB7)
	OGG_CRC[i] = r >>> 0
}
function oggCrc(buf) {
	let c = 0
	for (let i = 0; i < buf.length; i++) c = ((c << 8) ^ OGG_CRC[((c >>> 24) ^ buf[i]) & 0xFF]) >>> 0
	return c
}

/**
 * Build a single OGG page from complete packets.
 */
function makeOggPage(packets, granule, serial, seq, flags) {
	// Build segment table: each packet uses ceil(len/255) segments for 255-byte chunks + 1 terminating segment
	let segs = []
	for (let p of packets) {
		let len = p.length
		while (len >= 255) { segs.push(255); len -= 255 }
		segs.push(len) // terminating segment (0 if packet is exact multiple of 255)
	}

	let bodyLen = 0
	for (let p of packets) bodyLen += p.length
	let headerLen = 27 + segs.length
	let page = new Uint8Array(headerLen + bodyLen)
	let dv = new DataView(page.buffer)

	page[0] = 0x4F; page[1] = 0x67; page[2] = 0x67; page[3] = 0x53 // "OggS"
	page[4] = 0 // version
	page[5] = flags
	// Granule position (64-bit LE); -1 = not set (0xFFFFFFFFFFFFFFFF)
	if (granule < 0) { dv.setUint32(6, 0xFFFFFFFF, true); dv.setUint32(10, 0xFFFFFFFF, true) }
	else { dv.setUint32(6, granule >>> 0, true); dv.setUint32(10, (granule / 0x100000000) >>> 0, true) }
	dv.setUint32(14, serial, true)
	dv.setUint32(18, seq, true)
	dv.setUint32(22, 0, true) // CRC placeholder
	page[26] = segs.length
	for (let i = 0; i < segs.length; i++) page[27 + i] = segs[i]
	let off = headerLen
	for (let p of packets) { page.set(p, off); off += p.length }
	dv.setUint32(22, oggCrc(page), true)

	return page
}

/**
 * Wrap raw Vorbis header packets and audio frames into an OGG bitstream.
 * Max 255 segments per OGG page. Granule on EOS page set high to avoid truncation
 * (exact sample count is unknown without deep Vorbis mode parsing).
 */
function vorbisToOgg(headers, frames) {
	let serial = 0x564F5242, pages = [], seq = 0 // "VORB"

	// Page 0: BOS — identification header only, granule 0
	pages.push(makeOggPage([headers[0]], 0, serial, seq++, 0x02))
	// Page 1: comment + setup headers, granule 0
	pages.push(makeOggPage([headers[1], headers[2]], 0, serial, seq++, 0))

	// Audio pages — pack frames respecting 255-segment limit
	let i = 0
	while (i < frames.length) {
		let pkt = [], segCount = 0
		while (i < frames.length) {
			let needed = Math.floor(frames[i].length / 255) + 1
			if (segCount + needed > 255) break
			pkt.push(frames[i])
			segCount += needed
			i++
		}
		let isLast = i >= frames.length
		// Granule: -1 (not set) on intermediate pages; max safe int on EOS to avoid truncation
		pages.push(makeOggPage(pkt, isLast ? 0x1FFFFFFFFFFFFF : -1, serial, seq++, isLast ? 0x04 : 0))
	}

	let totalLen = 0
	for (let p of pages) totalLen += p.length
	let ogg = new Uint8Array(totalLen)
	let off = 0
	for (let p of pages) { ogg.set(p, off); off += p.length }
	return ogg
}

/**
 * Decode raw Vorbis frames via ogg-vorbis decoder
 */
async function decodeVorbis(info) {
	let { OggVorbisDecoder } = await import('@wasm-audio-decoders/ogg-vorbis')

	let headers = parseVorbisPrivate(info.codecPrivate)
	if (!headers) throw Error('Invalid Vorbis CodecPrivate')

	if (!info.frames.length) return EMPTY

	let ogg = vorbisToOgg(headers, info.frames)
	let dec = new OggVorbisDecoder()
	await dec.ready

	let result = await dec.decodeFile(ogg)
	dec.free()

	if (!result?.channelData?.length) return EMPTY

	let { channelData, samplesDecoded, sampleRate } = result
	if (samplesDecoded != null && samplesDecoded < channelData[0].length)
		channelData = channelData.map(ch => ch.subarray(0, samplesDecoded))

	return { channelData, sampleRate }
}

/**
 * Whole-file decode
 * @param {Uint8Array|ArrayBuffer} src
 * @returns {Promise<{channelData: Float32Array[], sampleRate: number}>}
 */
export default async function decode(src) {
	if (!src || typeof src === 'string' || !(src.buffer || src.byteLength != null || src.length))
		throw TypeError('Expected ArrayBuffer or Uint8Array')
	let buf = src instanceof Uint8Array ? src : new Uint8Array(src.buffer || src)
	if (!buf.length) throw Error('Not a WebM file')
	let dec = await decoder()
	try {
		let result = await dec.decode(buf)
		let flushed = await dec.flush()
		return merge(result, flushed)
	} finally {
		dec.free()
	}
}

/**
 * Create streaming decoder instance
 * @returns {Promise<{decode(chunk: Uint8Array): Promise<AudioData>, flush(): Promise<AudioData>, free(): void}>}
 */
export async function decoder() {
	let freed = false, chunks = [], totalLen = 0

	return {
		async decode(data) {
			if (freed) throw Error('Decoder already freed')
			if (!data?.length) return EMPTY
			chunks.push(data instanceof Uint8Array ? data : new Uint8Array(data))
			totalLen += data.length

			let buf = chunks.length === 1 ? chunks[0] : concat(chunks, totalLen)
			let info = parseWebm(buf)
			if (!info.frames.length) return EMPTY

			if (info.codec === 'A_OPUS') return decodeOpus(info)
			if (info.codec === 'A_VORBIS') return decodeVorbis(info)
			throw Error('Unsupported WebM codec: ' + info.codec)
		},
		async flush() {
			if (freed) return EMPTY
			freed = true
			chunks = []; totalLen = 0
			return EMPTY
		},
		free() {
			freed = true
			chunks = []; totalLen = 0
		}
	}
}

function concat(parts, totalLen) {
	let buf = new Uint8Array(totalLen), off = 0
	for (let c of parts) { buf.set(c, off); off += c.length }
	return buf
}

function merge(a, b) {
	if (!b?.channelData?.length) return a
	if (!a?.channelData?.length) return b
	return {
		channelData: a.channelData.map((ch, i) => {
			let m = new Float32Array(ch.length + b.channelData[i].length)
			m.set(ch); m.set(b.channelData[i], ch.length)
			return m
		}),
		sampleRate: a.sampleRate
	}
}
