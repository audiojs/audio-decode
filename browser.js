/**
 * Web-Audio-API decoder fn style
 *
 * @module  audio-decode
 */
'use strict';

const getContext = require('audio-context')
const toAB = require('to-array-buffer')

module.exports = decode;

function decode (buffer, opts, cb) {
	if (opts instanceof Function) {
		cb = opts;
		opts = {};
	}

	if (!opts) opts = {};

	let ctx = opts.context || getContext();

	//blob/file cases
	if (buffer instanceof Blob) buffer = new File([buffer], 'decode')
	if (buffer instanceof File) {
		return new Promise((resolve, reject) => {
			try {
				let reader = new FileReader()
				reader.readAsArrayBuffer(buffer)
				reader.onload = () => {
					return resolve(decode(reader.result, opts, cb))
				}
			} catch (e) {
				reject(e)
			}
		})
	}

	if (!(buffer instanceof ArrayBuffer)) {
		buffer = toAB(buffer)
	}

	// decodeAudioData spoils the initial buffer, so we have to copy that
	return ctx.decodeAudioData(buffer.slice(), (buf) => {
		cb && cb(null, buf);
	}, (err) => {
		cb && cb(err);
	});
}
