import decode, { decoder } from './decode-vorbis.js'
import ogg from 'audio-lena/ogg'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.log('  FAIL', msg) }
}
function near(a, b, tol = 0.02) { return Math.abs(a - b) < tol }
function rms(f32) { let s = 0; for (let i = 0; i < f32.length; i++) s += f32[i] * f32[i]; return Math.sqrt(s / f32.length) }

// whole-file decode
console.log('Vorbis whole-file')
{
	let r = await decode(ogg)
	ok(r.channelData.length >= 1, 'has channels')
	ok(r.sampleRate === 44100, 'sampleRate 44100')
	ok(near(r.channelData[0].length / r.sampleRate, 12.27), 'duration ~12.27s')
	ok(rms(r.channelData[0]) > 0.05, 'has audio content')
}

// streaming decoder
console.log('Vorbis streaming')
{
	let dec = await decoder()
	let buf = new Uint8Array(ogg)
	let a = await dec.decode(buf)
	dec.free()
	ok((a.channelData[0]?.length || 0) > 0, 'decoded samples')
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
