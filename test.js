
import decode from './audio-decode.js';
import wav from 'audio-lena/wav.js';
import t, { is } from 'tst';
// import mp3 from 'audio-lena/mp3';
// import raw from 'audio-lena/raw';
// import t from 'tape';


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

t('mp3 buffer', function (t) {
	decode(mp3, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 1}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	});
});

t('mp3 base64', t => {
	decode(require('audio-lena/mp3-base64'), (err, buf) => {
		if (err) t.fail(err)
		t.ok(buf.length)
		t.end()
	})
})

t.skip('ogg datauri', t => {
	// require('ogg.js')
	// require('vorbis.js')
	decode(require('audio-lena/ogg-datauri'), (err, buf) => {
		if (err) t.fail(err)

		try {
			play(buf, {end: 4}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	})
})

t('flac datauri', t => {
	require('flac.js')
	decode(require('audio-lena/flac-datauri'), (err, buf) => {
		if (err) t.fail(err)
		t.ok(buf.length)
		t.end()
	})
})

t.skip('raw floats', function (t) {
	decode(raw, (err, audioBuffer) => {
		play(audioBuffer, {end: 1}, () => {
			t.end()
		});
	})
})

t('promise', t => {
	decode(wav).then(audioBuffer => {
		play(audioBuffer, {end: 1}, () => {
			t.end()
		});
	}, err => {
		t.fail(err)
	});
})

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
