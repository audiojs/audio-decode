import decode, { decoder } from './webm-decode.js'
import { execSync } from 'child_process'
import { existsSync, readFileSync, mkdirSync } from 'fs'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.error('  FAIL', msg) }
}

const dur = r => r.channelData[0].length / r.sampleRate
const rms = f32 => { let s = 0; for (let i = 0; i < f32.length; i++) s += f32[i] * f32[i]; return Math.sqrt(s / f32.length) }
const near = (a, b, tol = 0.05) => Math.abs(a - b) < tol

// Generate test fixture with ffmpeg if available
let fixture = new URL('./fixtures/test.webm', import.meta.url)
let fixturePath = new URL('./fixtures/', import.meta.url)
let hasFixture = false

try {
	mkdirSync(new URL(fixturePath), { recursive: true })
	if (!existsSync(fixture)) {
		execSync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -c:a libopus -b:a 64k "${new URL(fixture).pathname}" -y 2>/dev/null`)
	}
	hasFixture = existsSync(fixture)
} catch { hasFixture = existsSync(fixture) }

// Also generate a stereo fixture
let stereoFixture = new URL('./fixtures/stereo.webm', import.meta.url)
let hasStereo = false
try {
	if (!existsSync(stereoFixture)) {
		execSync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -f lavfi -i "sine=frequency=880:duration=1" -filter_complex "[0:a][1:a]amerge=inputs=2" -c:a libopus -b:a 64k "${new URL(stereoFixture).pathname}" -y 2>/dev/null`)
	}
	hasStereo = existsSync(stereoFixture)
} catch { hasStereo = existsSync(stereoFixture) }

// --- EBML parsing unit tests ---

console.log('EBML parsing')

// Test: valid WebM detection
ok(await (async () => {
	try { await decode(new Uint8Array([0, 0, 0])); return false }
	catch (e) { return e.message.includes('Not a WebM') }
})(), 'rejects too-small buffer')

ok(await (async () => {
	try { await decode(new Uint8Array(100)); return false }
	catch (e) { return e.message.includes('Not a WebM') }
})(), 'rejects non-WebM data')

ok(await (async () => {
	try { await decode(null); return false }
	catch { return true }
})(), 'rejects null')

ok(await (async () => {
	try { await decode(new ArrayBuffer(0)); return false }
	catch { return true }
})(), 'rejects empty ArrayBuffer')

// --- Decoder lifecycle ---

console.log('Decoder lifecycle')

ok(await (async () => {
	let dec = await decoder()
	dec.free()
	try { await dec.decode(new Uint8Array(10)); return false }
	catch (e) { return e.message.includes('freed') }
})(), 'decode after free throws')

ok(await (async () => {
	let dec = await decoder()
	dec.free()
	dec.free()
	return true
})(), 'double free is safe')

ok(await (async () => {
	let dec = await decoder()
	let r = await dec.flush()
	return r.channelData.length === 0 && r.sampleRate === 0
})(), 'flush without data returns empty')

ok(await (async () => {
	let dec = await decoder()
	let r = await dec.decode(null)
	return r.channelData.length === 0 && r.sampleRate === 0
})(), 'decode null returns empty')

ok(await (async () => {
	let dec = await decoder()
	let r = await dec.decode(new Uint8Array(0))
	return r.channelData.length === 0 && r.sampleRate === 0
})(), 'decode empty returns empty')

// --- Integration tests (require ffmpeg fixture) ---

if (hasFixture) {
	console.log('WebM+Opus mono decode')
	let webm = readFileSync(fixture)

	ok(await (async () => {
		let r = await decode(webm)
		return r.channelData.length === 1 && r.sampleRate === 48000
	})(), 'mono: 1 channel, 48kHz')

	ok(await (async () => {
		let r = await decode(webm)
		return near(dur(r), 1.0, 0.1)
	})(), 'mono: ~1s duration')

	ok(await (async () => {
		let r = await decode(webm)
		return rms(r.channelData[0]) > 0.01
	})(), 'mono: has audio content')

	ok(await (async () => {
		let r = await decode(new Uint8Array(webm))
		return r.channelData.length >= 1
	})(), 'accepts Uint8Array input')

	ok(await (async () => {
		let r = await decode(webm.buffer.slice(webm.byteOffset, webm.byteOffset + webm.byteLength))
		return r.channelData.length >= 1
	})(), 'accepts ArrayBuffer input')

	// Streaming decoder test
	ok(await (async () => {
		let dec = await decoder()
		let r = await dec.decode(new Uint8Array(webm))
		let ok1 = r.channelData.length === 1 && r.sampleRate === 48000
		let f = await dec.flush()
		return ok1 && f.sampleRate === 0
	})(), 'streaming decoder works')
} else {
	console.log('SKIP: WebM+Opus mono decode (no ffmpeg / fixture)')
}

if (hasStereo) {
	console.log('WebM+Opus stereo decode')
	let webm = readFileSync(stereoFixture)

	ok(await (async () => {
		let r = await decode(webm)
		return r.channelData.length === 2 && r.sampleRate === 48000
	})(), 'stereo: 2 channels, 48kHz')

	ok(await (async () => {
		let r = await decode(webm)
		return near(dur(r), 1.0, 0.1)
	})(), 'stereo: ~1s duration')

	ok(await (async () => {
		let r = await decode(webm)
		let l = rms(r.channelData[0])
		let rr = rms(r.channelData[1])
		return l > 0.01 && rr > 0.01
	})(), 'stereo: both channels have content')
} else {
	console.log('SKIP: WebM+Opus stereo decode (no ffmpeg / fixture)')
}

// --- Video+Audio WebM (should extract audio only) ---

let videoAudioFixture = new URL('./fixtures/video-audio.webm', import.meta.url)
let hasVideoAudio = false
try {
	if (!existsSync(videoAudioFixture)) {
		execSync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -f lavfi -i "color=c=black:s=2x2:d=1" -c:a libopus -b:a 64k -c:v libvpx -b:v 100k "${new URL(videoAudioFixture).pathname}" -y 2>/dev/null`)
	}
	hasVideoAudio = existsSync(videoAudioFixture)
} catch { hasVideoAudio = existsSync(videoAudioFixture) }

if (hasVideoAudio) {
	console.log('WebM video+audio')
	let webm = readFileSync(videoAudioFixture)

	ok(await (async () => {
		let r = await decode(webm)
		return r.channelData.length >= 1 && r.sampleRate === 48000
	})(), 'extracts audio from video+audio WebM')

	ok(await (async () => {
		let r = await decode(webm)
		return near(dur(r), 1.0, 0.15)
	})(), 'video+audio: ~1s duration')

	ok(await (async () => {
		let r = await decode(webm)
		return rms(r.channelData[0]) > 0.01
	})(), 'video+audio: has audio content')
} else {
	console.log('SKIP: WebM video+audio (no ffmpeg / fixture)')
}

// --- Sequential determinism ---

if (hasFixture) {
	console.log('Sequential determinism')
	let webm = readFileSync(fixture)

	ok(await (async () => {
		let r1 = await decode(webm)
		let r2 = await decode(webm)
		if (r1.sampleRate !== r2.sampleRate) return false
		if (r1.channelData.length !== r2.channelData.length) return false
		for (let ch = 0; ch < r1.channelData.length; ch++) {
			let a = r1.channelData[ch], b = r2.channelData[ch]
			if (a.length !== b.length) return false
			for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
		}
		return true
	})(), 'sequential decodes produce identical output')
} else {
	console.log('SKIP: Sequential determinism (no fixture)')
}

// --- Concurrent decoders ---

if (hasFixture) {
	console.log('Concurrent decoders')
	let webm = readFileSync(fixture)

	ok(await (async () => {
		let results = await Promise.all([decode(webm), decode(webm), decode(webm)])
		return results.every(r => r.channelData.length === 1 && r.sampleRate === 48000 && near(dur(r), 1.0, 0.1))
	})(), 'Promise.all decode x3 succeeds')
} else {
	console.log('SKIP: Concurrent decoders (no fixture)')
}

// --- NaN/Inf validation ---

if (hasFixture) {
	console.log('NaN/Inf validation')
	let webm = readFileSync(fixture)

	ok(await (async () => {
		let r = await decode(webm)
		for (let ch of r.channelData)
			for (let i = 0; i < ch.length; i++)
				if (!isFinite(ch[i])) return false
		return true
	})(), 'no NaN or Infinity in output samples')
} else {
	console.log('SKIP: NaN/Inf validation (no fixture)')
}

// --- Performance benchmark ---

if (hasFixture) {
	console.log('Performance benchmark')
	let webm = readFileSync(fixture)
	let iters = 10
	let t0 = performance.now()
	for (let i = 0; i < iters; i++) await decode(webm)
	let elapsed = performance.now() - t0
	let avg = elapsed / iters
	console.log(`  ${iters} decodes in ${elapsed.toFixed(0)}ms (avg ${avg.toFixed(1)}ms)`)
	ok(avg < 5000, `avg decode < 5s (got ${avg.toFixed(1)}ms)`)
} else {
	console.log('SKIP: Performance benchmark (no fixture)')
}

// --- Real file: Opus mono (lena.webm) ---

console.log('real file: Opus mono')
{
	let webm = readFileSync(new URL('lena.webm', import.meta.resolve('audio-lena')))
	let r = await decode(webm)
	ok(r.channelData.length === 1, 'mono')
	ok(r.sampleRate === 48000, 'sampleRate 48000')
	ok(near(r.channelData[0].length / r.sampleRate, 12.27, 0.3), 'duration ~12.27s')
	ok(rms(r.channelData[0]) > 0.03, 'has audio content')
	// no NaN/Inf
	let bad = 0
	for (let ch of r.channelData) for (let i = 0; i < ch.length; i++) if (!isFinite(ch[i])) bad++
	ok(bad === 0, 'no NaN/Inf')
}

// --- Performance (real file) ---

console.log('performance (real file)')
{
	let webm = readFileSync(new URL('lena.webm', import.meta.resolve('audio-lena')))
	await decode(webm) // warmup
	let t0 = performance.now(), N = 5
	for (let i = 0; i < N; i++) await decode(webm)
	let ms = (performance.now() - t0) / N
	ok(ms < 2000, 'real file decode < 2s (' + ms.toFixed(0) + 'ms)')
	console.log('  ' + ms.toFixed(0) + 'ms/decode (161KB, 12.3s audio)')
}

// --- Vorbis: mono ---

console.log('WebM+Vorbis mono decode')
{
	let webm = readFileSync(new URL('./fixtures/vorbis-mono.webm', import.meta.url))
	let r = await decode(webm)
	ok(r.channelData.length === 1, 'vorbis mono: 1 channel')
	ok(r.sampleRate === 44100, 'vorbis mono: sampleRate 44100')
	ok(near(dur(r), 1.0, 0.1), 'vorbis mono: ~1s duration')
	ok(rms(r.channelData[0]) > 0.1, 'vorbis mono: has audio content')
	let bad = 0
	for (let ch of r.channelData) for (let i = 0; i < ch.length; i++) if (!isFinite(ch[i])) bad++
	ok(bad === 0, 'vorbis mono: no NaN/Inf')
}

// --- Vorbis: stereo ---

console.log('WebM+Vorbis stereo decode')
{
	let webm = readFileSync(new URL('./fixtures/vorbis-stereo.webm', import.meta.url))
	let r = await decode(webm)
	ok(r.channelData.length === 2, 'vorbis stereo: 2 channels')
	ok(r.sampleRate === 44100, 'vorbis stereo: sampleRate 44100')
	ok(near(dur(r), 1.0, 0.1), 'vorbis stereo: ~1s duration')
	ok(rms(r.channelData[0]) > 0.1 && rms(r.channelData[1]) > 0.1, 'vorbis stereo: both channels have content')
}

// --- Vorbis: real file (lena-vorbis.webm) ---

console.log('real file: Vorbis mono')
{
	let webm = readFileSync(new URL('lena-vorbis.webm', import.meta.resolve('audio-lena')))
	let r = await decode(webm)
	ok(r.channelData.length === 1, 'vorbis lena: mono')
	ok(r.sampleRate === 44100, 'vorbis lena: sampleRate 44100')
	ok(near(r.channelData[0].length / r.sampleRate, 12.27, 0.3), 'vorbis lena: duration ~12.27s')
	ok(rms(r.channelData[0]) > 0.03, 'vorbis lena: has audio content')
	let bad = 0
	for (let ch of r.channelData) for (let i = 0; i < ch.length; i++) if (!isFinite(ch[i])) bad++
	ok(bad === 0, 'vorbis lena: no NaN/Inf')
}

// --- Vorbis: determinism ---

console.log('Vorbis determinism')
{
	let webm = readFileSync(new URL('./fixtures/vorbis-mono.webm', import.meta.url))
	ok(await (async () => {
		let r1 = await decode(webm)
		let r2 = await decode(webm)
		if (r1.sampleRate !== r2.sampleRate) return false
		if (r1.channelData.length !== r2.channelData.length) return false
		for (let ch = 0; ch < r1.channelData.length; ch++) {
			let a = r1.channelData[ch], b = r2.channelData[ch]
			if (a.length !== b.length) return false
			for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
		}
		return true
	})(), 'vorbis: sequential decodes produce identical output')
}

// --- Vorbis: concurrent ---

console.log('Vorbis concurrent')
{
	let webm = readFileSync(new URL('./fixtures/vorbis-mono.webm', import.meta.url))
	ok(await (async () => {
		let results = await Promise.all([decode(webm), decode(webm), decode(webm)])
		return results.every(r => r.channelData.length === 1 && r.sampleRate === 44100 && near(dur(r), 1.0, 0.1))
	})(), 'vorbis: Promise.all decode x3 succeeds')
}

// --- Vorbis: performance ---

console.log('Vorbis performance')
{
	let webm = readFileSync(new URL('lena-vorbis.webm', import.meta.resolve('audio-lena')))
	await decode(webm) // warmup
	let t0 = performance.now(), N = 5
	for (let i = 0; i < N; i++) await decode(webm)
	let ms = (performance.now() - t0) / N
	ok(ms < 2000, 'vorbis decode < 2s (' + ms.toFixed(0) + 'ms)')
	console.log('  ' + ms.toFixed(0) + 'ms/decode (112KB, 12.3s audio)')
}

// --- Summary ---
console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
