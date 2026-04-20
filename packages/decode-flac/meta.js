/**
 * FLAC metadata parser — Vorbis comments, pictures, cue sheets.
 * @module @audio/decode-flac/meta
 */

const TD_U8 = new TextDecoder('utf-8'), TD_L1 = new TextDecoder('iso-8859-1')

function str(bytes, enc = 'utf-8') {
  let end = bytes.length
  while (end > 0 && bytes[end - 1] === 0) end--
  return (enc === 'iso-8859-1' ? TD_L1 : TD_U8).decode(bytes.subarray(0, end))
}

// ── Constants ───────────────────────────────────────────────────────────

const STREAMINFO = 0, PADDING = 1, VORBIS_COMMENT = 4, CUESHEET = 5, PICTURE = 6

export const VORBIS_MAP = {
  TITLE: 'title', ARTIST: 'artist', ALBUM: 'album', ALBUMARTIST: 'albumartist',
  COMPOSER: 'composer', GENRE: 'genre', DATE: 'year', TRACKNUMBER: 'track',
  DISCNUMBER: 'disc', BPM: 'bpm', KEY: 'key', COMMENT: 'comment', DESCRIPTION: 'comment',
  COPYRIGHT: 'copyright', ISRC: 'isrc', PUBLISHER: 'publisher', ENCODER: 'software',
  LYRICS: 'lyrics'
}

// ── Binary helpers ──────────────────────────────────────────────────────

function u32be(b, o) { return (b[o] * 0x1000000) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3] }
function u32le(b, o) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] * 0x1000000) }
function u24be(b, o) { return (b[o] << 16) | (b[o + 1] << 8) | b[o + 2] }
function fourcc(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]) }

// ── Block parsers ───────────────────────────────────────────────────────

function parseVorbisComment(b) {
  let off = 0
  let vendorLen = u32le(b, off); off += 4
  off += vendorLen
  let n = u32le(b, off); off += 4
  let out = {}
  for (let i = 0; i < n; i++) {
    let len = u32le(b, off); off += 4
    let s = str(b.subarray(off, off + len), 'utf-8')
    off += len
    let eq = s.indexOf('=')
    if (eq < 0) continue
    let key = s.slice(0, eq).toUpperCase(), val = s.slice(eq + 1)
    let norm = VORBIS_MAP[key]
    if (norm) out[norm] = val
  }
  return out
}

function parseFlacPicture(b) {
  let off = 0
  let type = u32be(b, off); off += 4
  let mimeLen = u32be(b, off); off += 4
  let mime = str(b.subarray(off, off + mimeLen), 'iso-8859-1'); off += mimeLen
  let descLen = u32be(b, off); off += 4
  let desc = str(b.subarray(off, off + descLen), 'utf-8'); off += descLen
  off += 16  // width, height, depth, colors
  let dataLen = u32be(b, off); off += 4
  let data = b.slice(off, off + dataLen)
  return { mime, type, description: desc, data }
}

function parseCueSheet(b) {
  let markers = [], regions = []
  let off = 395  // media catalog (128) + leadin (8) + flags (1) + reserved (258)
  if (b.length < off + 1) return { markers, regions }
  let numTracks = b[off]; off += 1
  for (let t = 0; t < numTracks; t++) {
    if (off + 36 > b.length) break
    let trackOffLow = u32be(b, off + 4), trackOffHigh = u32be(b, off)
    let trackOffset = trackOffHigh * 0x100000000 + trackOffLow
    let trackNum = b[off + 8]
    let nIdx = b[off + 35]
    off += 36
    if (nIdx > 0 && trackNum < 170) markers.push({ sample: trackOffset, label: `Track ${trackNum}` })
    off += nIdx * 12
  }
  return { markers, regions }
}

/** Parse FLAC metadata blocks. Returns {meta, sampleRate, markers, regions} or null. */
export function parseMeta(bytes) {
  if (!bytes?.length || bytes.length < 4 || fourcc(bytes, 0) !== 'fLaC') return null
  let meta = {}, raw = { blocks: [] }, pictures = []
  let sampleRate = 0, markers = [], regions = []
  let off = 4
  while (off + 4 <= bytes.length) {
    let hdr = bytes[off]
    let last = !!(hdr & 0x80), type = hdr & 0x7f
    let size = u24be(bytes, off + 1)
    let body = bytes.subarray(off + 4, off + 4 + size)
    if (type !== STREAMINFO && type !== PADDING) raw.blocks.push({ type, body })
    if (type === STREAMINFO && body.length >= 18) {
      sampleRate = (body[10] << 12) | (body[11] << 4) | (body[12] >> 4)
    } else if (type === VORBIS_COMMENT) {
      Object.assign(meta, parseVorbisComment(body))
    } else if (type === PICTURE) {
      let p = parseFlacPicture(body)
      if (p) pictures.push(p)
    } else if (type === CUESHEET) {
      let c = parseCueSheet(body)
      markers.push(...c.markers); regions.push(...c.regions)
    }
    off += 4 + size
    if (last) break
  }

  meta.raw = raw
  meta.pictures = pictures
  return { meta, sampleRate, markers, regions }
}
