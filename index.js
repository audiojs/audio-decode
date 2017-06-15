/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */
'use strict';

const getType = require('audio-type');
const WavDecoder = require('wav-decoder');
const util = require('audio-buffer-utils');
const toBuffer = require('typedarray-to-buffer');
const isBuffer = require('is-buffer');
const AV = require('av');
require('mp3');
require('flac');
require('aac');
require('alac');

module.exports = (buffer, opts, cb) => {
	if (opts instanceof Function) {
		cb = opts;
		opts = {};
	}

	if (!opts) opts = {};
	if (!cb) cb = (() => {});

	if (!isBuffer(buffer)) buffer = toBuffer(buffer);

	let type = getType(buffer);

	if (!type) {
		let err = Error('Cannot detect audio format of buffer');
		cb(err);
		return Promise.reject(err);
	}

	if (type === 'wav') {
		return WavDecoder.decode(buffer).then(audioData => {
			let audioBuffer = util.create(audioData.channelData, audioData.numberOfChannels, audioData.sampleRate);
			cb(null, audioBuffer);
			return Promise.resolve(audioBuffer);
		}, err => {
			cb(err);
			return Promise.reject(err);
		});
	}

	/*
	if (type === 'ogg') {
		let decoder = ogg.Decoder()

		decoder.on('stream', function (stream) {
			stream.on('data', function (packet) {

			})

			stream.on('end', function () {

			})
		})
	}
	*/

	//handle other codecs by AV
	let asset = AV.Asset.fromBuffer(buffer);

	return new Promise((resolve, reject) => {
		try {
			asset.decodeToBuffer((buffer) => {
				let data = util.create(buffer, asset.format.channelsPerFrame, asset.format.sampleRate);
				cb(null, data);
				resolve(data)
			});
		} catch (e) {
			cb(e);
			reject(e);
		}
	});
};
