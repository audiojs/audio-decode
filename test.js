'use strict';

const decode = require('./');
const wav = require('audio-lena/wav');
const mp3 = require('audio-lena/mp3');
const util = require('audio-buffer-utils');
const context = require('audio-context');
const play = require('audio-play');
const test = require('tst');


//as a callback
test('wav', function (done) {
	this.timeout(5000);
	decode(wav, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 6}, done);
		} catch (e) {
			throw e;
		}
	});
});

test('mp3', function (done) {
	this.timeout(5000);
	decode(mp3, {context: context}, (err, audioBuffer) => {
		try {
			play(audioBuffer, {end: 6}, done);
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

