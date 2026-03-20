import { readFileSync } from 'fs'
import decode, { decoder } from './aac-decode.js'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.log('  FAIL', msg) }
}
function near(a, b, tol = 0.02) { return Math.abs(a - b) < tol }
function rms(f32) { let s = 0; for (let i = 0; i < f32.length; i++) s += f32[i] * f32[i]; return Math.sqrt(s / f32.length) }

let m4a = readFileSync(new URL('lena.m4a', import.meta.resolve('audio-lena')))
let aac = readFileSync(new URL('lena.aac', import.meta.resolve('audio-lena')))

// ---- M4A decode ----
console.log('M4A decode')
{
	let r = await decode(m4a)
	ok(r.channelData.length === 2, 'stereo')
	ok(r.sampleRate === 44100, 'sampleRate 44100')
	ok(near(r.channelData[0].length / r.sampleRate, 12.28, 0.05), 'duration ~12.28s')
	ok(rms(r.channelData[0]) > 0.05, 'has audio content')
	// verify no NaN/Inf
	let bad = 0
	for (let ch of r.channelData) for (let i = 0; i < ch.length; i++) if (!isFinite(ch[i])) bad++
	ok(bad === 0, 'no NaN/Inf in output')
}

// ---- ADTS decode ----
console.log('ADTS decode')
{
	let r = await decode(aac)
	ok(r.channelData.length >= 1, 'has channels (' + r.channelData.length + ')')
	ok(r.sampleRate === 44100, 'sampleRate 44100')
	ok(r.channelData[0].length > 100000, 'has samples (' + r.channelData[0].length + ')')
	ok(rms(r.channelData[0]) > 0.05, 'has audio content')
	// no NaN
	let bad = 0
	for (let i = 0; i < r.channelData[0].length; i++) if (!isFinite(r.channelData[0][i])) bad++
	ok(bad === 0, 'no NaN/Inf')
}

// ---- Stereo separation ----
console.log('stereo separation')
{
	let r = await decode(m4a)
	let diff = 0
	for (let i = 0; i < Math.min(1000, r.channelData[0].length); i++)
		diff += Math.abs(r.channelData[0][i] - r.channelData[1][i])
	ok(diff > 0.001, 'L/R channels differ')
}

// ---- Sequential determinism ----
console.log('sequential determinism')
{
	let r1 = await decode(m4a)
	let r2 = await decode(m4a)
	ok(r1.channelData[0].length === r2.channelData[0].length, 'same length')
	ok(r1.sampleRate === r2.sampleRate, 'same sampleRate')
	let maxDiff = 0
	for (let i = 0; i < r1.channelData[0].length; i++)
		maxDiff = Math.max(maxDiff, Math.abs(r1.channelData[0][i] - r2.channelData[0][i]))
	ok(maxDiff === 0, 'identical output')
}

// ---- Concurrent decoders ----
console.log('concurrent decoders')
{
	let [r1, r2] = await Promise.all([decode(m4a), decode(m4a)])
	ok(r1.channelData[0].length === r2.channelData[0].length, 'same length')
}

// ---- Lifecycle ----
console.log('lifecycle')
{
	// decode after free throws
	let d = await decoder()
	d.free()
	let threw = false
	try { d.decode(new Uint8Array(m4a)) } catch { threw = true }
	ok(threw, 'decode after free throws')

	// double free is safe
	d = await decoder()
	d.decode(new Uint8Array(m4a))
	d.free()
	d.free()
	ok(true, 'double free ok')

	// flush returns EMPTY
	d = await decoder()
	d.decode(new Uint8Array(m4a))
	let f = d.flush()
	ok(f.channelData.length === 0, 'flush returns EMPTY')
	d.free()
}

// ---- ADTS streaming (partial frame buffering) ----
console.log('ADTS streaming')
{
	let ref = await decode(aac)

	for (let chunkSize of [100, 300]) {
		let dec = await decoder()
		let chunks = []
		for (let off = 0; off < aac.length; off += chunkSize) {
			let r = dec.decode(aac.subarray(off, Math.min(off + chunkSize, aac.length)))
			if (r.channelData.length) chunks.push(r.channelData[0])
		}
		let f = dec.flush()
		if (f.channelData.length) chunks.push(f.channelData[0])
		dec.free()

		let total = chunks.reduce((s, c) => s + c.length, 0)
		ok(total === ref.channelData[0].length, 'chunk=' + chunkSize + ' count matches (' + total + ')')

		// verify content matches one-shot
		let stream = new Float32Array(total), pos = 0
		for (let c of chunks) { stream.set(c, pos); pos += c.length }
		let maxDiff = 0
		for (let i = 0; i < total; i++) maxDiff = Math.max(maxDiff, Math.abs(stream[i] - ref.channelData[0][i]))
		ok(maxDiff === 0, 'chunk=' + chunkSize + ' content identical (maxDiff=' + maxDiff + ')')
	}
}

// ---- Edge cases ----
console.log('edge cases')
{
	// empty input
	let d = await decoder()
	let r = d.decode(new Uint8Array(0))
	ok(r.channelData.length === 0, 'empty input → EMPTY')
	d.free()

	// null input
	d = await decoder()
	r = d.decode(null)
	ok(r.channelData.length === 0, 'null input → EMPTY')
	d.free()

	// garbage input
	d = await decoder()
	let garbage = new Uint8Array(1000)
	crypto.getRandomValues(garbage)
	try {
		r = d.decode(garbage)
		ok(r.channelData.length === 0, 'garbage → EMPTY or error')
	} catch {
		ok(true, 'garbage → threw (ok)')
	}
	d.free()

	// truncated M4A (ftyp header only)
	d = await decoder()
	r = d.decode(new Uint8Array(m4a.subarray(0, 500)))
	ok(r.channelData.length === 0, 'truncated M4A → EMPTY')
	d.free()

	// ArrayBuffer input
	r = await decode(m4a.buffer.slice(m4a.byteOffset, m4a.byteOffset + m4a.length))
	ok(r.channelData.length === 2, 'ArrayBuffer input works')
}

// ---- Performance ----
console.log('performance')
{
	// warmup
	await decode(m4a)
	let t0 = performance.now(), N = 10
	for (let i = 0; i < N; i++) await decode(m4a)
	let ms = (performance.now() - t0) / N
	ok(ms < 200, 'M4A decode < 200ms (' + ms.toFixed(1) + 'ms)')
	console.log('  ' + ms.toFixed(1) + 'ms/decode (249KB, 12.3s audio)')
}

console.log(`\n${pass + fail} tests, ${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
