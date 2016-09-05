const decode = require('./');
const buffer = require('audio-lena');
const util = require('audio-buffer-utils');
const context = require('audio-context');


//as a callback
decode(buffer, {context: context}, (err, audioBuffer) => {
	play(audioBuffer);
});


//as a promise
setTimeout(() => {
	decode(buffer, {context: context}).then(play, err => {
		//:'(
	});
}, 1000);


//play sound
function play (buffer) {
	buffer = util.slice(buffer, 0, 44100);
	let sourceNode = context.createBufferSource();
	sourceNode.connect(context.destination);
	sourceNode.buffer = buffer;
	sourceNode.start();
}
