const decode = require('./');
const buffer = require('audio-lena');
const util = require('audio-buffer-utils');

//as a callback
decode(buffer, {context: true}, audioBuffer => {
	play(audioBuffer);
});


//as a promise
// decode(buffer, {context: context}).then(play, err => {
// 	//:'(
// });


//play sound
function play (buffer, end) {
	let sourceNode = context.createBufferSource();
	sourceNode.connect(context.destination);
	sourceNode.buffer = buffer;
	sourceNode.start();
}
