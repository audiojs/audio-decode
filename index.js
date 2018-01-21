/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */
'use strict';

const getType = require('audio-type');
const WavDecoder = require('wav-decoder');
const createBuffer = require('audio-buffer-from');
const toArrayBuffer = require('to-array-buffer')
const toBuffer = require('typedarray-to-buffer')
const isBuffer = require('is-buffer');
const AV = require('av');
require('mp3');

module.exports = (buffer, opts, cb) => {
	if (opts instanceof Function) {
		cb = opts;
		opts = {};
	}

	if (!opts) opts = {};
	if (!cb) cb = (() => {});

	if (!isBuffer(buffer)) {
		if (ArrayBuffer.isView(buffer)) buffer = toBuffer(buffer)
		else {
			buffer = Buffer.from(toArrayBuffer(buffer));
		}
	}

	let type = getType(buffer);

	if (!type) {
		let err = Error('Cannot detect audio format of buffer');
		cb(err);
		return Promise.reject(err);
	}

	// direct wav decoder
	if (type === 'wav') {
		return WavDecoder.decode(buffer).then(audioData => {
			let audioBuffer = createBuffer(audioData.channelData, {
				channels: audioData.numberOfChannels,
				sampleRate: audioData.sampleRate
			});
			cb(null, audioBuffer);
			return Promise.resolve(audioBuffer);
		}, err => {
			cb(err);
			return Promise.reject(err);
		});
	}

	// ogg decoder
	/*
	if (type === 'ogg' || type === 'oga' || type === 'ogv') {
		let decoder = new ogg.Decoder();

		decoder.on('stream', function (stream) {
			stream.on('packet', function (packet) {
				console.log('got "packet":', packet.length);
			});

			// emitted after the last packet of the stream
			stream.on('end', function () {
				console.log('got "end":', decoder[191]);
			});
		});

		decoder.write(buffer)
	}
	*/

	//handle other codecs by AV
	return new Promise((resolve, reject) => {
		let asset = AV.Asset.fromBuffer(buffer);

		asset.on('error', err => {
			cb(err)
			reject(err)
		})

		asset.decodeToBuffer((buffer) => {
			let data = createBuffer(buffer, {
				channels: asset.format.channelsPerFrame,
				sampleRate: asset.format.sampleRate
			})
			cb(null, data);
			resolve(data)
		});
	});
};
