import decode, { demuxASF, parsePacket } from './wma-decode.js'
import { execSync } from 'child_process'
import { existsSync, readFileSync, mkdirSync } from 'fs'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.error('  FAIL', msg) }
}
function near(a, b, tol = 0.05) { return Math.abs(a - b) < tol }

// Generate test WMA fixtures with ffmpeg
let fixturesDir = new URL('./fixtures/', import.meta.url)
mkdirSync(fixturesDir, { recursive: true })

let monoPath = new URL('./fixtures/mono.wma', import.meta.url)
let stereoPath = new URL('./fixtures/stereo.wma', import.meta.url)
let hasMono = false, hasStereo = false

try {
	if (!existsSync(monoPath))
		execSync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ac 1 -c:a wmav2 -b:a 64k "${new URL(monoPath).pathname}" -y 2>/dev/null`)
	hasMono = existsSync(monoPath)
} catch { hasMono = existsSync(monoPath) }

try {
	if (!existsSync(stereoPath))
		execSync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ac 2 -c:a wmav2 -b:a 128k "${new URL(stereoPath).pathname}" -y 2>/dev/null`)
	hasStereo = existsSync(stereoPath)
} catch { hasStereo = existsSync(stereoPath) }

// --- ASF demuxer unit tests ---

console.log('ASF validation')

ok((() => {
	try { demuxASF(new Uint8Array(10)); return false }
	catch (e) { return e.message.includes('Not an ASF') }
})(), 'rejects too-small buffer')

ok((() => {
	try { demuxASF(new Uint8Array(100)); return false }
	catch (e) { return e.message.includes('Not an ASF') }
})(), 'rejects non-ASF data')

ok((() => {
	try { demuxASF(null); return false }
	catch { return true }
})(), 'rejects null')

ok((() => {
	try { demuxASF(new Uint8Array(0)); return false }
	catch { return true }
})(), 'rejects empty buffer')

// --- ASF header parsing (requires fixture) ---

if (hasMono) {
	console.log('ASF demux: mono WMA')
	let buf = new Uint8Array(readFileSync(monoPath))
	let asf = demuxASF(buf)

	ok(asf.channels === 1, 'channels: ' + asf.channels)
	ok(asf.sampleRate === 44100 || asf.sampleRate === 22050 || asf.sampleRate === 48000,
		'sampleRate: ' + asf.sampleRate)
	ok(asf.formatTag === 0x0161, 'formatTag: 0x' + asf.formatTag.toString(16) + ' (WMAv2)')
	ok(asf.blockAlign > 0, 'blockAlign: ' + asf.blockAlign)
	ok(asf.bitRate > 0, 'bitRate: ' + asf.bitRate)
	ok(asf.bitsPerSample >= 0, 'bitsPerSample: ' + asf.bitsPerSample)
	ok(asf.packetSize > 0, 'packetSize: ' + asf.packetSize)
	ok(asf.packets.length > 0, 'packets: ' + asf.packets.length)
	ok(near(asf.duration, 1.0, 0.2), 'duration: ' + asf.duration.toFixed(2) + 's (~1s)')

	// All packets should be exactly packetSize
	let allSized = asf.packets.every(p => p.length === asf.packetSize)
	ok(allSized, 'all packets are packetSize bytes')

	// Codec-specific data should exist for WMAv2
	ok(asf.codecData && asf.codecData.length > 0, 'codecData: ' + (asf.codecData?.length || 0) + ' bytes')
} else {
	console.log('SKIP: ASF demux mono (no ffmpeg / fixture)')
}

if (hasStereo) {
	console.log('ASF demux: stereo WMA')
	let buf = new Uint8Array(readFileSync(stereoPath))
	let asf = demuxASF(buf)

	ok(asf.channels === 2, 'channels: ' + asf.channels)
	ok(asf.sampleRate > 0, 'sampleRate: ' + asf.sampleRate)
	ok(asf.formatTag === 0x0161, 'formatTag: 0x' + asf.formatTag.toString(16))
	ok(asf.packets.length > 0, 'packets: ' + asf.packets.length)
	ok(near(asf.duration, 1.0, 0.2), 'duration: ' + asf.duration.toFixed(2) + 's (~1s)')
} else {
	console.log('SKIP: ASF demux stereo (no ffmpeg / fixture)')
}

// --- Packet parsing ---

if (hasMono) {
	console.log('packet parsing')
	let buf = new Uint8Array(readFileSync(monoPath))
	let asf = demuxASF(buf)

	// Parse first packet
	let payloads = parsePacket(asf.packets[0], asf.packetSize)
	ok(payloads.length > 0, 'first packet has ' + payloads.length + ' payload(s)')
	ok(payloads[0].length > 0, 'first payload is ' + payloads[0].length + ' bytes')

	// Parse all packets — should not throw
	let totalPayloads = 0
	let totalPayloadBytes = 0
	for (let pkt of asf.packets) {
		let pp = parsePacket(pkt, asf.packetSize)
		totalPayloads += pp.length
		for (let p of pp) totalPayloadBytes += p.length
	}
	ok(totalPayloads > 0, 'total payloads: ' + totalPayloads)
	ok(totalPayloadBytes > 0, 'total payload bytes: ' + totalPayloadBytes)

	// Empty/null packet
	ok(parsePacket(null, 100).length === 0, 'null packet → empty')
	ok(parsePacket(new Uint8Array(0), 100).length === 0, 'empty packet → empty')
	ok(parsePacket(new Uint8Array(2), 100).length === 0, 'tiny packet → empty')
} else {
	console.log('SKIP: packet parsing (no ffmpeg / fixture)')
}

// --- ArrayBuffer input ---

if (hasMono) {
	console.log('input types')
	let buf = readFileSync(monoPath)

	// Buffer (Node)
	let asf1 = demuxASF(buf)
	ok(asf1.packets.length > 0, 'Buffer input works')

	// ArrayBuffer
	let ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
	let asf2 = demuxASF(new Uint8Array(ab))
	ok(asf2.packets.length > 0, 'ArrayBuffer input works')

	// Verify identical results
	ok(asf1.channels === asf2.channels, 'same channels')
	ok(asf1.sampleRate === asf2.sampleRate, 'same sampleRate')
	ok(asf1.packets.length === asf2.packets.length, 'same packet count')
} else {
	console.log('SKIP: input types (no ffmpeg / fixture)')
}

// --- Determinism ---

if (hasMono) {
	console.log('determinism')
	let buf = new Uint8Array(readFileSync(monoPath))
	let a = demuxASF(buf)
	let b = demuxASF(buf)
	ok(a.channels === b.channels && a.sampleRate === b.sampleRate && a.packets.length === b.packets.length,
		'demux is deterministic')
} else {
	console.log('SKIP: determinism (no ffmpeg / fixture)')
}

// --- Edge cases ---

console.log('edge cases')

// Truncated ASF header (valid GUID but truncated)
ok((() => {
	// Build a buffer with valid ASF header GUID but too small
	let guid = [0x30,0x26,0xb2,0x75,0x8e,0x66,0xcf,0x11,0xa6,0xd9,0x00,0xaa,0x00,0x62,0xce,0x6c]
	let buf = new Uint8Array(30)
	buf.set(guid, 0)
	// Set header size to something reasonable
	buf[16] = 30
	try { demuxASF(buf); return false }
	catch (e) { return e.message.includes('No audio stream') }
})(), 'truncated ASF header → no audio stream error')

// --- Concurrent demux ---

if (hasMono) {
	console.log('concurrent demux')
	let buf = new Uint8Array(readFileSync(monoPath))
	let results = await Promise.all([demuxASF(buf), demuxASF(buf), demuxASF(buf)])
	ok(results.every(r => r.channels === results[0].channels && r.sampleRate === results[0].sampleRate && r.packets.length === results[0].packets.length),
		'parallel demuxASF produces identical results')
} else {
	console.log('SKIP: concurrent demux (no ffmpeg / fixture)')
}

// --- NaN check on demux output ---

if (hasMono) {
	console.log('NaN check')
	let buf = new Uint8Array(readFileSync(monoPath))
	let asf = demuxASF(buf)
	ok(!Number.isNaN(asf.channels) && asf.channels !== undefined, 'channels is not NaN/undefined')
	ok(!Number.isNaN(asf.sampleRate) && asf.sampleRate !== undefined, 'sampleRate is not NaN/undefined')
	ok(!Number.isNaN(asf.bitRate) && asf.bitRate !== undefined, 'bitRate is not NaN/undefined')
	ok(!Number.isNaN(asf.blockAlign) && asf.blockAlign !== undefined, 'blockAlign is not NaN/undefined')
	ok(!Number.isNaN(asf.bitsPerSample) && asf.bitsPerSample !== undefined, 'bitsPerSample is not NaN/undefined')
	ok(!Number.isNaN(asf.formatTag) && asf.formatTag !== undefined, 'formatTag is not NaN/undefined')
	ok(!Number.isNaN(asf.duration) && asf.duration !== undefined, 'duration is not NaN/undefined')
	ok(!Number.isNaN(asf.packetSize) && asf.packetSize !== undefined, 'packetSize is not NaN/undefined')
} else {
	console.log('SKIP: NaN check (no ffmpeg / fixture)')
}

// --- WASM decode: real file ---

let lenaPath = new URL('lena.wma', import.meta.resolve('audio-lena'))
if (existsSync(lenaPath)) {
	console.log('WASM decode: lena.wma')
	let wma = readFileSync(lenaPath)
	let rms = arr => Math.sqrt(arr.reduce((s, v) => s + v * v, 0) / arr.length)
	let r = await decode(wma)
	ok(r.channelData.length === 1, 'mono')
	ok(r.sampleRate === 44100, 'sampleRate 44100')
	ok(near(r.channelData[0].length / r.sampleRate, 12.2, 0.5), 'duration ~12.2s')
	ok(rms(r.channelData[0]) > 0.03, 'has audio content')
} else {
	console.log('SKIP: WASM decode (no lena.wma)')
}

// --- Summary ---

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
