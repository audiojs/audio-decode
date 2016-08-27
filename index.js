/**
 * Web-Audio-API decoder
 *
 * @module  audio-decode
 */

const context = require('audio-context');


function decode (buffer, opts, cb) {
	if (arguments.length === 2) {
		if (cb instanceof Function) {
			opts = {};
		}
		else {
			opts = cb;
		}
	}

	if (!opts) opts = {};

	let context = opts.context || context;

	return context.decodeAudioData(buffer, cb);
}
