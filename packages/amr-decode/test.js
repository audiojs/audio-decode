import { readFileSync } from 'fs'
import decode, { decoder } from './amr-decode.js'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.log('  FAIL', msg) }
}
function rms(f32) { let s = 0; for (let i = 0; i < f32.length; i++) s += f32[i] * f32[i]; return Math.sqrt(s / f32.length) }

let nb = readFileSync(new URL('./fixtures/test-nb.amr', import.meta.url))
let wb = readFileSync(new URL('./fixtures/test-wb.amr', import.meta.url))

// ---- AMR-NB decode ----
console.log('AMR-NB decode')
{
	let r = await decode(nb)
	ok(r.channelData.length === 1, 'mono')
	ok(r.sampleRate === 8000, 'sampleRate 8000')
	ok(r.channelData[0].length === 160 * 50, 'correct sample count (8000 in 1s)')
	// verify no NaN/Inf
	let bad = 0
	for (let i = 0; i < r.channelData[0].length; i++) if (!isFinite(r.channelData[0][i])) bad++
	ok(bad === 0, 'no NaN/Inf in output')
	ok(rms(r.channelData[0]) < 0.1, 'rms in range (silence fixture)')
}

// ---- AMR-WB decode ----
console.log('AMR-WB decode')
{
	let r = await decode(wb)
	ok(r.channelData.length === 1, 'mono')
	ok(r.sampleRate === 16000, 'sampleRate 16000')
	ok(r.channelData[0].length === 320 * 50, 'correct sample count (16000 in 1s)')
	let bad = 0
	for (let i = 0; i < r.channelData[0].length; i++) if (!isFinite(r.channelData[0][i])) bad++
	ok(bad === 0, 'no NaN/Inf in output')
	ok(rms(r.channelData[0]) < 0.1, 'rms in range (comfort noise fixture)')
}

// ---- Sequential determinism ----
console.log('sequential determinism')
{
	let r1 = await decode(nb)
	let r2 = await decode(nb)
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
	let [r1, r2] = await Promise.all([decode(nb), decode(wb)])
	ok(r1.channelData[0].length === 8000, 'NB length ok')
	ok(r2.channelData[0].length === 16000, 'WB length ok')
}

// ---- Lifecycle ----
console.log('lifecycle')
{
	// decode after free throws
	let d = await decoder()
	d.free()
	let threw = false
	try { d.decode(new Uint8Array(nb)) } catch { threw = true }
	ok(threw, 'decode after free throws')

	// double free is safe
	d = await decoder()
	d.decode(new Uint8Array(nb))
	d.free()
	d.free()
	ok(true, 'double free ok')

	// flush returns EMPTY
	d = await decoder()
	d.decode(new Uint8Array(nb))
	let f = d.flush()
	ok(f.channelData.length === 0, 'flush returns EMPTY')
	d.free()
}

// ---- Edge cases ----
console.log('edge cases')
{
	// empty input
	let d = await decoder()
	let r = d.decode(new Uint8Array(0))
	ok(r.channelData.length === 0, 'empty input -> EMPTY')
	d.free()

	// null input
	d = await decoder()
	r = d.decode(null)
	ok(r.channelData.length === 0, 'null input -> EMPTY')
	d.free()

	// garbage input (no AMR header)
	d = await decoder()
	let garbage = new Uint8Array(1000)
	crypto.getRandomValues(garbage)
	r = d.decode(garbage)
	ok(r.channelData.length === 0, 'garbage -> EMPTY')
	d.free()

	// truncated NB (header only)
	d = await decoder()
	r = d.decode(new Uint8Array([0x23, 0x21, 0x41, 0x4D, 0x52, 0x0A]))
	ok(r.channelData.length === 0, 'header-only -> EMPTY')
	d.free()

	// ArrayBuffer input
	r = await decode(nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.length))
	ok(r.channelData.length === 1, 'ArrayBuffer input works')
}

// ---- Cross-validation ----
console.log('cross-validation')
{
	// NB: 1s fixture → duration = samples / sampleRate
	let r = await decode(nb)
	let dur = r.channelData[0].length / r.sampleRate
	ok(Math.abs(dur - 1.0) < 0.05, `NB duration ${dur.toFixed(3)}s ≈ 1s`)

	// WB: 1s fixture → duration = samples / sampleRate
	r = await decode(wb)
	dur = r.channelData[0].length / r.sampleRate
	ok(Math.abs(dur - 1.0) < 0.05, `WB duration ${dur.toFixed(3)}s ≈ 1s`)

	// decode() vs decoder() produce identical output
	let via_decode = await decode(nb)
	let d = await decoder()
	let via_decoder = d.decode(new Uint8Array(nb))
	d.free()
	ok(via_decode.channelData[0].length === via_decoder.channelData[0].length, 'decode() vs decoder() same length')
	let match = true
	for (let i = 0; i < via_decode.channelData[0].length; i++) {
		if (via_decode.channelData[0][i] !== via_decoder.channelData[0][i]) { match = false; break }
	}
	ok(match, 'decode() vs decoder() identical samples')

	// NB RMS energy: silence fixture should have very low energy
	let nbRms = rms(via_decode.channelData[0])
	ok(nbRms < 0.01, `NB RMS ${nbRms.toFixed(6)} < 0.01 (silence)`)

	// WB RMS energy
	r = await decode(wb)
	let wbRms = rms(r.channelData[0])
	ok(wbRms < 0.01, `WB RMS ${wbRms.toFixed(6)} < 0.01 (comfort noise)`)

	// all samples in [-1, 1] range
	let nbMax = 0, wbMax = 0
	for (let s of via_decode.channelData[0]) nbMax = Math.max(nbMax, Math.abs(s))
	for (let s of r.channelData[0]) wbMax = Math.max(wbMax, Math.abs(s))
	ok(nbMax <= 1.0, `NB samples in [-1,1] (max ${nbMax.toFixed(6)})`)
	ok(wbMax <= 1.0, `WB samples in [-1,1] (max ${wbMax.toFixed(6)})`)
}

// ---- Header-only AMR file (audio-type fixture) ----
console.log('header-only external fixture')
{
	let headerOnly = readFileSync('/Users/div/projects/audio-type/fixture.amr')
	let r = await decode(headerOnly)
	ok(r.channelData.length === 0, 'audio-type fixture.amr (header-only) → EMPTY')
}

// ---- Performance ----
console.log('performance')
{
	let N = 100
	let t0 = performance.now()
	for (let i = 0; i < N; i++) await decode(nb)
	let nbMs = performance.now() - t0
	t0 = performance.now()
	for (let i = 0; i < N; i++) await decode(wb)
	let wbMs = performance.now() - t0
	console.log(`  NB: ${N} decodes in ${nbMs.toFixed(1)}ms (${(nbMs / N).toFixed(2)}ms/decode)`)
	console.log(`  WB: ${N} decodes in ${wbMs.toFixed(1)}ms (${(wbMs / N).toFixed(2)}ms/decode)`)
	ok(nbMs / N < 50, 'NB decode < 50ms each')
	ok(wbMs / N < 50, 'WB decode < 50ms each')
}

console.log(`\n${pass + fail} tests, ${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
