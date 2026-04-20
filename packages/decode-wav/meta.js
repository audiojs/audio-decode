/**
 * WAV RIFF metadata parser — INFO, bext, iXML, cue/adtl chunks.
 * @module @audio/decode-wav/meta
 */

const TD_U8 = new TextDecoder('utf-8'), TD_L1 = new TextDecoder('iso-8859-1')

function str(bytes, enc = 'utf-8') {
  let end = bytes.length
  while (end > 0 && bytes[end - 1] === 0) end--
  return (enc === 'iso-8859-1' ? TD_L1 : TD_U8).decode(bytes.subarray(0, end))
}

// ── Constants ───────────────────────────────────────────────────────────

export const INFO_MAP = {
  INAM: 'title', IART: 'artist', IPRD: 'album', IGNR: 'genre',
  ICRD: 'year', ITRK: 'track', ICMT: 'comment', ICOP: 'copyright',
  IENG: 'engineer', ISFT: 'software', ISRC: 'isrc', ISBJ: 'subject',
  IKEY: 'keywords', IARL: 'location'
}

// ── Binary helpers ──────────────────────────────────────────────────────

function u32le(b, o) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] * 0x1000000) }
function u16le(b, o) { return b[o] | (b[o + 1] << 8) }
function fourcc(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]) }

// ── Chunk parsers ───────────────────────────────────────────────────────

function parseBext(b) {
  if (b.length < 348) return null
  return {
    description: str(b.subarray(0, 256)),
    originator: str(b.subarray(256, 288)),
    originatorReference: str(b.subarray(288, 320)),
    originationDate: str(b.subarray(320, 330)),
    originationTime: str(b.subarray(330, 338)),
    timeReferenceLow: u32le(b, 338),
    timeReferenceHigh: u32le(b, 342),
    version: u16le(b, 346)
  }
}

function parseInfo(b) {
  let out = {}, off = 0
  while (off + 8 <= b.length) {
    let id = fourcc(b, off), size = u32le(b, off + 4)
    let v = str(b.subarray(off + 8, off + 8 + size))
    let key = INFO_MAP[id]
    if (key) out[key] = v
    off += 8 + size + (size & 1)
  }
  return out
}

function parseCue(b, cues) {
  let n = u32le(b, 0)
  for (let i = 0; i < n; i++) {
    let o = 4 + i * 24
    if (o + 24 > b.length) break
    let id = u32le(b, o), pos = u32le(b, o + 20)
    cues.set(id, pos)
  }
}

function parseAdtl(b, labels, notes, ltxts) {
  let off = 0
  while (off + 8 <= b.length) {
    let id = fourcc(b, off), size = u32le(b, off + 4)
    let body = b.subarray(off + 8, off + 8 + size)
    if (id === 'labl' && body.length >= 4) labels.set(u32le(body, 0), str(body.subarray(4)))
    else if (id === 'note' && body.length >= 4) notes.set(u32le(body, 0), str(body.subarray(4)))
    else if (id === 'ltxt' && body.length >= 20) ltxts.set(u32le(body, 0), { duration: u32le(body, 4), label: str(body.subarray(20)) })
    off += 8 + size + (size & 1)
  }
}

/** Parse WAV RIFF metadata. Returns {meta, sampleRate, markers, regions} or null. */
export function parseMeta(bytes) {
  if (!bytes?.length || bytes.length < 12 || fourcc(bytes, 0) !== 'RIFF' || fourcc(bytes, 8) !== 'WAVE') return null
  let meta = {}, raw = {}, pictures = [], markers = [], regions = []
  let cues = new Map(), labels = new Map(), notes = new Map(), ltxts = new Map()
  let sampleRate = 0

  let off = 12
  while (off + 8 <= bytes.length) {
    let id = fourcc(bytes, off), size = u32le(bytes, off + 4)
    let body = bytes.subarray(off + 8, off + 8 + size)
    if (id === 'fmt ' && body.length >= 16) sampleRate = u32le(body, 4)
    else if (id === 'bext') raw.bext = parseBext(body)
    else if (id === 'iXML') raw.iXML = str(body, 'utf-8')
    else if (id === 'LIST' && body.length >= 4 && fourcc(body, 0) === 'INFO') Object.assign(meta, parseInfo(body.subarray(4)))
    // NOTE: embedded ID3 in WAV (id === 'ID3 ') not parsed here — use @audio/decode-mp3/meta for that
    else if (id === 'cue ') parseCue(body, cues)
    else if (id === 'LIST' && body.length >= 4 && fourcc(body, 0) === 'adtl') parseAdtl(body.subarray(4), labels, notes, ltxts)
    off += 8 + size + (size & 1)
  }

  for (let [id, pos] of cues) {
    let label = labels.get(id) || notes.get(id) || ''
    let lt = ltxts.get(id)
    if (lt && lt.duration > 0) regions.push({ sample: pos, length: lt.duration, label: lt.label || label })
    else markers.push({ sample: pos, label })
  }
  markers.sort((a, b) => a.sample - b.sample)
  regions.sort((a, b) => a.sample - b.sample)

  if (raw.bext?.description && !meta.comment) meta.comment = raw.bext.description

  meta.raw = raw
  meta.pictures = pictures
  return { meta, sampleRate, markers, regions }
}
