/**
 * Meta parsers — re-export from codec packages.
 * @module audio-decode/meta
 *
 * import { wav, mp3, flac } from 'audio-decode/meta'
 * let result = wav(bytes)  // { meta, markers, regions } | null
 */

export { parseMeta as wav } from '@audio/decode-wav/meta'
export { parseMeta as mp3, parseId3v2 } from '@audio/decode-mp3/meta'
export { parseMeta as flac } from '@audio/decode-flac/meta'
