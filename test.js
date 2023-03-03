
import decode, {decoders} from './audio-decode.js';
import wav from 'audio-lena/wav.js';
import mp3 from 'audio-lena/mp3.js';
import ogg from 'audio-lena/ogg.js';
import flac from 'audio-lena/flac.js';
import t, { is, throws } from 'tst';


//as a callback
t('wav buffer', async function (t) {
	console.time('wav first')
	await decoders.wav()
	console.timeEnd('wav first')

	console.time('wav second')
	let audioBuffer = await decode(wav)
	console.timeEnd('wav second')
	is(audioBuffer.duration | 0, 12, 'wav duration')
});

t('mp3 buffer', async function (t) {
	console.time('mp3 first')
	await decoders.mp3()
	console.timeEnd('mp3 first')

	console.time('mp3 second')
	let audioBuffer = await decode(mp3)
	console.timeEnd('mp3 second')
	is(audioBuffer.duration | 0, 12, 'mp3 duration')
});

t('ogg buffer', async function (t) {
	console.time('ogg first')
	let audioBuffer = await decode(ogg)
	console.timeEnd('ogg first')
	is(audioBuffer.duration | 0, 12, 'ogg duration')

	console.time('ogg second')
	audioBuffer = await decode(ogg)
	console.timeEnd('ogg second')
	is(audioBuffer.duration | 0, 12, 'ogg duration')
});

t('flac buffer', async function (t) {
	console.time('flac first')
	let audioBuffer = await decode(flac)
	console.timeEnd('flac first')
	is(audioBuffer.duration | 0, 12, 'flac duration')

	console.time('flac second')
	audioBuffer = await decode(flac)
	console.timeEnd('flac second')
	is(audioBuffer.duration | 0, 12, 'flac duration')
});

t('malformed data', async t => {
	let log = []
	try {
		let x = await decode(new Float32Array(10))
	} catch (e) { log.push('arr')}

	try {
		let x = await decode(null)
	} catch (e) { log.push('null')}

	is(log, ['arr', 'null'])
})
