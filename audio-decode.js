/**
 * Web-Audio-API decoder
 * @module  audio-decode
 */

import getType from 'audio-type';
import AudioBufferShim from 'audio-buffer';

const AudioBuffer = globalThis.AudioBuffer || AudioBufferShim

export default async function audioDecode (buf, context) {
	if (!buf && !(buf.length || buf.buffer)) throw Error('Bad decode target')
	buf = new Uint8Array(buf.buffer || buf)

	let type = getType(buf);

	if (!type) throw Error('Cannot detect audio format');

	if (!decoders[type]) throw Error('Missing decoder for ' + type + ' format')

	return decoders[type](buf, context)
};

export const decoders = {
	async oga(buf, context) {
		let { OggVorbisDecoder } = await import('@wasm-audio-decoders/ogg-vorbis')
		const decoder = new OggVorbisDecoder()
		await decoder.ready;
		return (decoders.oga = async buf => buf && createBuffer(await decoder.decodeFile(buf), context))(buf)
	},
	async mp3(buf, context) {
		const { MPEGDecoder } = await import('mpg123-decoder')
		const decoder = new MPEGDecoder()
		await decoder.ready;
		return (decoders.mp3 = buf => buf && createBuffer(decoder.decode(buf), context))(buf)
	},
	async flac(buf, context) {
		const { FLACDecoder } = await import('@wasm-audio-decoders/flac')
		const decoder = new FLACDecoder()
		await decoder.ready;
		return (decoders.mp3 = async buf => buf && createBuffer(await decoder.decode(buf), context))(buf)
	},
	async opus(buf, context) {
		const { OggOpusDecoder } = await import('ogg-opus-decoder')
		const decoder = new OggOpusDecoder()
		await decoder.ready;
		return (decoders.opus = async buf => buf && createBuffer(await decoder.decodeFile(buf), context))(buf)
	},
	async wav(buf, context) {
		let module = await import('node-wav')
		let { decode } = module.default
		return (decoders.wav = buf => buf && createBuffer(decode(buf), context) )(buf)
	},
	async qoa(buf, context) {
		let { decode } = await import('qoa-format')
		return (decoders.qoa = buf => buf && createBuffer(decode(buf), context) )(buf)
	}
}

function createBuffer({channelData, sampleRate}, context) {
	let audioBuffer;
	if (context) {
		audioBuffer = context.createBuffer(
			channelData.length,
			channelData[0].length,
			sampleRate
		);
	} else {
		audioBuffer = new AudioBuffer({
			sampleRate,
			length: channelData[0].length,
			numberOfChannels: channelData.length
		})
	}
	for (let ch = 0; ch < channelData.length; ch++) audioBuffer.getChannelData(ch).set(channelData[ch])
	return audioBuffer
}
