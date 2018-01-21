'use strict';

const decode = require('./');
const wav = require('audio-lena/wav');
const mp3 = require('audio-lena/mp3');
const raw = require('audio-lena/raw');
const context = require('audio-context')();
const play = require('audio-play');
const t = require('tape');
const isBrowser = require('is-browser')


//as a callback
t('wav buffer', function (t) {
	decode(wav, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 2}, () => t.end());
		} catch (e) {
			throw e;
		}
	});
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

isBrowser && t('File', t => {
	decode(new File([mp3], 'lena.mp3'), (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 1}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	});
})

isBrowser && t('Blob', t => {
	decode(new Blob([mp3]), (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 1}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	});
})

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
