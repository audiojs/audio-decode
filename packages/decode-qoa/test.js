import decode, { decoder } from './decode-qoa.js'
import { readFileSync } from 'fs'

let pass = 0, fail = 0
function ok(cond, msg) {
	if (cond) { pass++; console.log('  ok', msg) }
	else { fail++; console.log('  FAIL', msg) }
}

let qoa = readFileSync(new URL('../../fixtures/qoa-sample.qoa', import.meta.url))

// whole-file decode
console.log('QOA whole-file')
{
	let r = await decode(qoa)
	ok(r.channelData.length >= 1, 'has channels')
	ok(r.sampleRate > 0, 'sampleRate: ' + r.sampleRate)
	ok(r.channelData[0].length > 0, 'has samples: ' + r.channelData[0].length)
}

// decoder interface
console.log('QOA decoder')
{
	let dec = await decoder()
	let r = dec.decode(qoa)
	ok(r.channelData.length >= 1, 'has channels')
	ok(r.sampleRate > 0, 'sampleRate: ' + r.sampleRate)
	let f = dec.flush()
	ok(f.channelData.length === 0, 'flush empty')
	dec.free()
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
