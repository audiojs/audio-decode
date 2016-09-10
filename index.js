/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */
'use strict';

const getType = require('audio-type');
const WavDecoder = require('wav-decoder');
const AudioBuffer = require('audio-buffer');

module.exports = (buffer, opts, cb) => {
	if (opts instanceof Function) {
		cb = opts;
		opts = {};
	}

	if (!opts) opts = {};

	if (buffer instanceof ArrayBuffer) buffer = Buffer.from(buffer);

	let type = getType(buffer);

	if (!type) {
		cb && cb(err);
		return Promise.reject('Cannot detect audio format of buffer');
	}

	if (type === 'wav') {
		return WavDecoder.decode(buffer).then(audioData => {
			let audioBuffer = AudioBuffer(audioData.numberOfChannels, audioData.channelData, audioData.sampleRate);
			cb && cb(null, audioBuffer);
			return Promise.resolve(audioBuffer);
		}, err => {
			cb && cb(err);
			return Promise.reject(err);
		});
	}

	return Promise.reject('Format ' + type + ' is not supported yet.');
};
