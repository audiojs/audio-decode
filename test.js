'use strict';

const decode = require('./');
const wav = require('audio-lena/wav');
const mp3 = require('audio-lena/mp3');
const raw = require('audio-lena/buffer');
const context = require('audio-context')();
const play = require('audio-play');
const t = require('tape');


//as a callback
t('wav', function (t) {
	decode(wav, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 2}, () => t.end());
		} catch (e) {
			throw e;
		}
	});
});

t('mp3', function (t) {
	decode(mp3, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 2}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	});
});

t.skip('raw floats', function (t) {
	decode(raw, {context: context}, (err, audioBuffer) => {
		play(audioBuffer, {end: 2}, () => {
			t.end()
		});
	})
})

t('promise', t => {
	decode(wav, {context: context}).then(audioBuffer => {
		play(audioBuffer, {end: 2}, () => {
			t.end()
		});
	}, err => {
		t.fail(err)
	});
})
