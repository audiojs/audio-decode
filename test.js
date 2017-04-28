'use strict';

const decode = require('./');
const wav = require('audio-lena/wav');
const mp3 = require('audio-lena/mp3');
const context = require('audio-context');
const play = require('audio-play');
const t = require('tape');


//as a callback
t('wav', function (t) {
	decode(wav, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 6}, () => t.end());
		} catch (e) {
			throw e;
		}
	});
});

t('mp3', function (t) {
	decode(mp3, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 6}, () => {
				t.end()
			});
		} catch (e) {
			throw e;
		}
	});
});


//as a promise
// setTimeout(() => {
// 	decode(buffer, {context: context}).then(play, err => {
// 		console.log(err)
// 	});
// }, 1000);

