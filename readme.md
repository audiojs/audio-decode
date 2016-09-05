# audio-decode [![Build Status](https://travis-ci.org/audiojs/audio-decode.svg?branch=master)](https://travis-ci.org/audiojs/audio-decode) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges) [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Convert _ArrayBuffer_ with audio encoded in any format to [AudioBuffer](https://github.com/audiojs/audio-buffer). Basically [context.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData) for node and browser.

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
const decode = require('audio-decode');
const buffer = require('audio-lena');
const context = require('audio-context');

//as a callback
decode(buffer, {context: context}, audioBuffer => {
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

## API

`**let promise = decode(arrayBuffer, options?, callback?)**`

Decode array buffer, based on options maybe and pass data to the callback when done, or resolve a promise if no callback passed.

You can use stream version as `require('audio-decode/stream')`.
