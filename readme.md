# audio-decode [![Build Status](https://travis-ci.org/audiojs/audio-decode.svg?branch=master)](https://travis-ci.org/audiojs/audio-decode) [![unstable](https://img.shields.io/badge/stability-unstable-orange.svg)](http://github.com/badges/stability-badges) [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/audio-decode.svg)](https://greenkeeper.io/)

Convert _ArrayBuffer_ with audio encoded in any format to [AudioBuffer](https://github.com/audiojs/audio-buffer). Basically [context.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData) for node and browser.

[![npm install audio-decode](https://nodei.co/npm/audio-decode.png?mini=true)](https://npmjs.org/package/audio-decode/)

```js
const decode = require('audio-decode');
const buffer = require('audio-lena');
const context = require('audio-context');

//as a callback
decode(buffer, {context: context}, (err, audioBuffer) => {});

//as a promise
decode(buffer, {context: context}).then(audioBuffer => {}, err => {});
```

## API

**`let promise = decode(arrayBuffer, options?, callback?)`**

Decode array buffer, based on options maybe and pass data to the callback when done, or resolve a promise if no callback passed.

Possible options may include `context` property for web-audio-api context. If not defined, the [audio-context](https://npmjs.org/package/audio-context) will be used.

## Supported formats

Shipped by default:

* [x] _wav_ via [wav-decoder](https://github.com/mohayonao/wav-decoder)
* [x] _mp3_ via [aurora mp3](https://github.com/audiocogs/mp3.js)
* [x] _flac_ via [flac.js](https://github.com/audiocogs/flac.js)
* [x] _alac_ via [alac.js](https://github.com/audiocogs/alac.js)
* [x] _aac_ via [aac.js](https://github.com/audiocogs/aac.js)

To enable additional format, install it as a dependency `npm install --save flac.js` and require once `require('flac.js')`.


## Credits

* [@mohayonao](https://github.com/mohayonao/) for [wav-decoder](https://github.com/mohayonao/wav-decoder).
* [@devongovett](https://github.com/devongovett) and [@jensnockert](https://github.com/jensnockert) for [aurora.js](https://github.com/audiocogs/aurora.js).
* [@jamen](https://github.com/jamen) as originator of this package.

