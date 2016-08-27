/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */

const context = require('audio-context');

module.exports = decode;

function decode (buffer, opts, cb) {
	if (arguments.length === 2) {
		if (opts instanceof Function) {
			cb = opts;
			opts = {};
		}
		else {
			opts = cb;
		}
	}

	if (!opts) opts = {};

	let ctx = opts.context || context;

	return ctx.decodeAudioData(buffer, cb);
}
