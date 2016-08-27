# audio-decode [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Convert _ArrayBuffer_ with audio encoded in any format to [AudioBuffer](https://github.com/audiojs/audio-buffer). Basically [context.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData) for node and browser.

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
const decode = require('audio-decode');
const buffer = require('audio-lena');

//as a callback
decode(buffer, {context: true}, audioBuffer => {
	play(audioBuffer);
});

//as a promise
decode(buffer, {context: context}).then(play, err => {
	//:'(
});


//play sound
function play (buffer) {
	let sourceNode = context.createBufferSource();
	sourceNode.connect(context.destination);
	sourceNode.buffer = buffer;
	sourceNode.start();
}
```

You can use stream version as `require('audio-decode/stream')`.
