import decode, { decoders, decodeStream } from './audio-decode.js';
import wav from 'audio-lena/wav.js';
import mp3 from 'audio-lena/mp3.js';
import ogg from 'audio-lena/ogg.js';
import flac from 'audio-lena/flac.js';
import opus from 'audio-lena/opus.js';
import t, { is } from 'tst';
import { readFileSync } from 'fs';

const qoa = readFileSync(new URL('./fixtures/qoa-sample.qoa', import.meta.url))
const m4a = readFileSync(new URL(import.meta.resolve('audio-lena/lena.m4a')))

const dur = r => r.channelData[0].length / r.sampleRate
const rms = f32 => { let s = 0; for (let i = 0; i < f32.length; i++) s += f32[i] * f32[i]; return Math.sqrt(s / f32.length) }
const near = (a, b, tol = 0.02) => Math.abs(a - b) < tol

// -- whole-file decode with content verification --

t('wav', async () => {
	let r = await decode(wav)
	is(r.channelData.length, 1)
	is(r.sampleRate, 44100)
	is(near(dur(r), 12.27), true, 'duration')
	is(near(rms(r.channelData[0]), 0.13, 0.01), true, 'rms')
})

t('mp3', async () => {
	let r = await decode(mp3)
	is(r.channelData.length, 2)
	is(r.sampleRate, 44100)
	is(near(dur(r), 12.27), true, 'duration')
	is(near(rms(r.channelData[0]), 0.13, 0.01), true, 'rms')
})

t('ogg vorbis', async () => {
	let r = await decode(ogg)
	is(r.sampleRate, 44100)
	is(near(dur(r), 12.27), true, 'duration')
	is(near(rms(r.channelData[0]), 0.13, 0.01), true, 'rms')
})

t('flac', async () => {
	let r = await decode(flac)
	is(r.sampleRate, 44100)
	is(near(dur(r), 12.27), true, 'duration')
	// flac is lossless, must match wav exactly
	is(near(rms(r.channelData[0]), 0.1298, 0.001), true, 'rms lossless')
})

t('opus', async () => {
	let r = await decode(opus)
	is(r.sampleRate, 48000)
	is(near(dur(r), 12.27), true, 'duration')
	is(near(rms(r.channelData[0]), 0.12, 0.02), true, 'rms')
})

t('m4a', async () => {
	let r = await decode(m4a)
	is(r.channelData.length, 2)
	is(r.sampleRate, 44100)
	is(near(dur(r), 12.27), true, 'duration')
	is(rms(r.channelData[0]) > 0.05, true, 'has audio content')
})

t('m4a iPhone voice memo', async () => {
	let hk = readFileSync(new URL('./fixtures/hk.m4a', import.meta.url))
	let r = await decode(hk)
	is(r.channelData.length, 1)
	is(r.sampleRate, 48000)
	is(near(dur(r), 2.35, 0.1), true, 'duration')
	is(rms(r.channelData[0]) > 0.01, true, 'has audio content')
})

t('qoa', async () => {
	let r = await decode(qoa)
	is(near(dur(r), 0.82, 0.05), true, 'duration')
	is(r.channelData.length >= 1, true, 'channels')
})

t('uint8array input', async () => {
	let r = await decode(new Uint8Array(wav))
	is(near(dur(r), 12.27), true)
})

t('buffer input', async () => {
	let r = await decode(Buffer.from(wav))
	is(near(dur(r), 12.27), true)
})

// -- streaming via decoders --

t('stream mp3', async () => {
	let dec = await decoders.mp3()
	let r = await dec.decode(new Uint8Array(mp3))
	is(r.channelData.length > 0, true)
	is(r.channelData[0].length > 0, true)
	is(r.sampleRate, 44100)
	await dec.decode()
})

t('stream wav', async () => {
	let dec = await decoders.wav()
	let r = await dec.decode(new Uint8Array(wav))
	is(r.channelData[0].length > 0, true)
	is(r.sampleRate, 44100)
})

t('stream flac', async () => {
	let dec = await decoders.flac()
	let r = await dec.decode(new Uint8Array(flac))
	is(r.channelData[0].length > 0, true)
	await dec.decode()
})

t('stream opus', async () => {
	let dec = await decoders.opus()
	let r = await dec.decode(new Uint8Array(opus))
	is(r.channelData[0].length > 0, true)
	await dec.decode()
})

t('stream oga', async () => {
	let dec = await decoders.oga()
	let r = await dec.decode(new Uint8Array(ogg))
	is(r.channelData[0].length > 0, true)
	await dec.decode()
})

t('stream m4a', async () => {
	let dec = await decoders.m4a()
	let r = await dec.decode(new Uint8Array(m4a))
	is(r.channelData.length > 0, true)
	is(r.channelData[0].length > 0, true)
	is(r.sampleRate, 44100)
	await dec.decode()
})

// -- flush / free lifecycle --

t('double flush', async () => {
	let dec = await decoders.mp3()
	await dec.decode(new Uint8Array(mp3))
	await dec.decode()
	let r = await dec.decode()
	is(r.channelData.length, 0)
	is(r.sampleRate, 0)
})

t('free without flush', async () => {
	let dec = await decoders.mp3()
	await dec.decode(new Uint8Array(mp3))
	dec.free()
	let r = await dec.decode()
	is(r.channelData.length, 0)
})

t('decode after free throws', async () => {
	let dec = await decoders.mp3()
	dec.free()
	let threw = false
	try { await dec.decode(new Uint8Array(mp3)) } catch { threw = true }
	is(threw, true)
})

t('double free is safe', async () => {
	let dec = await decoders.flac()
	dec.free()
	dec.free()
})

// -- EMPTY immutability --

t('empty result is immutable', async () => {
	let dec = await decoders.mp3()
	await dec.decode()
	let r = await dec.decode()
	let threw = false
	try { r.sampleRate = 999 } catch { threw = true }
	is(threw, true)
	try { r.channelData.push(new Float32Array(1)) } catch { threw = true }
	is(threw, true)
})

// -- input validation --

t('rejects string', async () => {
	let threw = false
	try { await decode('hello') } catch (e) { threw = e instanceof TypeError }
	is(threw, true)
})

t('rejects null', async () => {
	let threw = false
	try { await decode(null) } catch { threw = true }
	is(threw, true)
})

t('rejects number', async () => {
	let threw = false
	try { await decode(42) } catch { threw = true }
	is(threw, true)
})

t('rejects non-audio buffer', async () => {
	let threw = false
	try { await decode(new Uint8Array(100)) } catch (e) { threw = e.message.includes('Unknown audio') }
	is(threw, true)
})

// -- concurrent decoders --

t('concurrent decoding', async () => {
	let [r1, r2, r3] = await Promise.all([
		decode(mp3),
		decode(flac),
		decode(ogg),
	])
	is(near(dur(r1), 12.27), true, 'mp3 concurrent')
	is(near(dur(r2), 12.27), true, 'flac concurrent')
	is(near(dur(r3), 12.27), true, 'ogg concurrent')
})

t('concurrent stream decoders', async () => {
	let [d1, d2] = await Promise.all([decoders.mp3(), decoders.flac()])
	let [r1, r2] = await Promise.all([
		d1.decode(new Uint8Array(mp3)),
		d2.decode(new Uint8Array(flac)),
	])
	is(r1.channelData[0].length > 0, true)
	is(r2.channelData[0].length > 0, true)
	await Promise.all([d1.decode(), d2.decode()])
})

// -- zero-length / edge cases --

t('zero-length buffer', async () => {
	let threw = false
	try { await decode(new ArrayBuffer(0)) } catch { threw = true }
	is(threw, true)
})

t('minimal invalid buffer', async () => {
	let threw = false
	try { await decode(new Uint8Array([0])) } catch { threw = true }
	is(threw, true)
})

// -- decodeStream --

t('decodeStream mp3', async () => {
	let chunks = [new Uint8Array(mp3)]
	async function* gen() { for (let c of chunks) yield c }
	let total = 0
	for await (let r of decodeStream(gen(), 'mp3')) {
		is(r.sampleRate > 0, true)
		total += r.channelData[0].length
	}
	is(total > 0, true, 'decoded samples')
})

t('decodeStream ReadableStream', async () => {
	let data = new Uint8Array(wav)
	let stream = new ReadableStream({
		start(ctrl) { ctrl.enqueue(data); ctrl.close() }
	})
	let total = 0
	for await (let r of decodeStream(stream, 'wav')) {
		is(r.sampleRate, 44100)
		total += r.channelData[0].length
	}
	is(total > 0, true)
})

t('decodeStream m4a', async () => {
	async function* gen() { yield new Uint8Array(m4a) }
	let total = 0
	for await (let r of decodeStream(gen(), 'm4a')) {
		is(r.sampleRate, 44100)
		total += r.channelData[0].length
	}
	is(total > 0, true)
})

t('decodeStream m4a chunked', async () => {
	// M4A needs full file (moov atom), so chunked streaming must buffer until flush
	let buf = new Uint8Array(m4a), chunkSize = 16384
	async function* gen() {
		for (let off = 0; off < buf.length; off += chunkSize)
			yield buf.subarray(off, Math.min(off + chunkSize, buf.length))
	}
	let total = 0
	for await (let r of decodeStream(gen(), 'm4a')) {
		total += r.channelData[0].length
	}
	let ref = await decode(m4a)
	is(total, ref.channelData[0].length, 'chunked M4A matches one-shot')
})

t('decodeStream unknown format', async () => {
	let threw = false
	try { for await (let _ of decodeStream([], 'xyz')) {} } catch { threw = true }
	is(threw, true)
})

// -- decoders extensibility --

t('custom decoder registration', async () => {
	decoders.test = async () => ({
		decode: async (chunk) => ({ channelData: [new Float32Array(chunk.length)], sampleRate: 8000 }),
		free() {}
	})
	let dec = await decoders.test()
	let r = await dec.decode(new Uint8Array(10))
	is(r.sampleRate, 8000)
	is(r.channelData[0].length, 10)
	delete decoders.test
})
