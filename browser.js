/**
 * Web-Audio-API decoder fn style
 *
 * @module  audio-decode
 */
'use strict';

const getContext = require('audio-context');

module.exports = decode;

function decode (buffer, opts, cb) {
	if (opts instanceof Function) {
		cb = opts;
		opts = {};
	}

	if (!opts) opts = {};

	let ctx = opts.context || getContext();

	return ctx.decodeAudioData(buffer, (buf) => {
		cb && cb(null, buf);
	}, (err) => {
		cb && cb(err);
	});
}
