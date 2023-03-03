
import decode from './audio-decode.js';
import wav from 'audio-lena/wav.js';
import mp3 from 'audio-lena/mp3.js';
import t, { is } from 'tst';


//as a callback
t('wav buffer', async function (t) {
	console.time('wav first')
	let audioBuffer = await decode(wav)
	console.timeEnd('wav first')
	is(audioBuffer.duration | 0, 12, 'wav duration')

	console.time('wav second')
	audioBuffer = await decode(wav)
	console.timeEnd('wav second')
	is(audioBuffer.duration | 0, 12, 'wav duration')
});

t('mp3 buffer', async function (t) {
	console.time('mp3 first')
	let audioBuffer = await decode(mp3)
	console.timeEnd('mp3 first')
	is(audioBuffer.duration | 0, 12, 'mp3 duration')

	console.time('mp3 second')
	audioBuffer = await decode(mp3)
	console.timeEnd('mp3 second')
	is(audioBuffer.duration | 0, 12, 'mp3 duration')
});

t('decode error', t => {
	decode(new Float32Array(10)).then(data => {
		t.fail(data)
	}, err => {
		t.ok(err)
	})

	decode(null).then(data => {
		t.fail(data)
	}, err => {
		t.ok(err)
	})

	decode(require('audio-lena/mp3-base64') + 'xxx', (err, buf) => {
		t.ok(err)
		t.end()
	})
})
