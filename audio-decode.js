/**
 * Web-Audio-API decoder
 * @module  audio-decode
 */

import getType from 'audio-type';
import AudioBufferShim from 'audio-buffer';

const AudioBuffer = globalThis.AudioBuffer || AudioBufferShim

export default async function audioDecode (buf, opts) {
	if (!buf) throw Error('No decode target')
	buf = new Uint8Array(buf.buffer || buf)

	let type = getType(buf);

	if (!type) throw Error('Cannot detect audio format');

	if (!decoders[type]) throw Error('Missing decoder for ' + type + ' format')

	return decoders[type](buf)
};

export const decoders = {
	async ogg() {
		let { OggVorbisDecoder } = await importDecoder('ogg')
		decoder = new OggVorbisDecoder()
	},
	async mp3() {
		let { MPEGDecoder } = await importDecoder('mp3')
		let decoder = new MPEGDecoder()
	},
	async flac() {

		let { FLACDecoder } = await importDecoder('flac')
		decoder = new FLACDecoder().decodeFile
	},
	async opus() {

		let { OpusDecoder } = await importDecoder('opus')
		decoder = new OpusDecoder().decode
	},
	async wav(buf) {
		let {decode} = await import('node-wav')
		return (decoders.wav = buf => createBuffer(decode(buf)) )(buf)
	}
}

function createBuffer({channelData, sampleRate}) {
	let audioBuffer = new AudioBuffer({
		sampleRate,
		length: channelData[0].length,
		numberOfChannels: channelData.length
	})
	for (let ch = 0; ch < channelData.length; ch++) audioBuffer.getChannelData(ch).set(channelData[ch])
	return audioBuffer
}
