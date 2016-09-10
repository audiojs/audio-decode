'use strict';

const decode = require('./');
const buffer = require('audio-lena');
const util = require('audio-buffer-utils');
const context = require('audio-context');
const play = require('audio-play');

//as a callback
decode(buffer, {context: context}, (err, audioBuffer) => {
	try {
		play(audioBuffer);
	} catch (e) {
		throw e;
	}
});


//as a promise
// setTimeout(() => {
// 	decode(buffer, {context: context}).then(play, err => {
// 		console.log(err)
// 	});
// }, 1000);

