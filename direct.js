/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */

const context = require('audio-context');

module.exports = decode;

function decode (buffer, opts, cb, err) {
	if (opts instanceof Function) {
		err = cb;
		cb = opts;
		opts = {};
	}
	else {
		opts = cb;
	}

	if (!opts) opts = {};

	let ctx = opts.context || context;

	return ctx.decodeAudioData(buffer, cb, err);
}
