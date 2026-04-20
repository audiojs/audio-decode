/**
 * ID3v2 metadata parser for MP3 files.
 * @module @audio/decode-mp3/meta
 */

const TD_U8 = new TextDecoder('utf-8'), TD_L1 = new TextDecoder('iso-8859-1')

function str(bytes, enc = 'utf-8') {
  let end = bytes.length
  if (enc === 'utf-16') {
    while (end >= 2 && bytes[end - 1] === 0 && bytes[end - 2] === 0) end -= 2
    return new TextDecoder('utf-16').decode(bytes.subarray(0, end))
  }
  while (end > 0 && bytes[end - 1] === 0) end--
  return (enc === 'iso-8859-1' ? TD_L1 : TD_U8).decode(bytes.subarray(0, end))
}

// ── Constants ───────────────────────────────────────────────────────────

export const ID3_MAP = {
  TIT2: 'title', TPE1: 'artist', TALB: 'album', TPE2: 'albumartist',
  TCOM: 'composer', TCON: 'genre', TYER: 'year', TDRC: 'year',
  TRCK: 'track', TPOS: 'disc', TBPM: 'bpm', TKEY: 'key',
  TCOP: 'copyright', TSRC: 'isrc', TPUB: 'publisher', TENC: 'software',
  COMM: 'comment', USLT: 'lyrics'
}

// ── Binary helpers ──────────────────────────────────────────────────────

function u32be(b, o) { return (b[o] * 0x1000000) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3] }
function synchsafe(b, o) { return (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3] }

// ── ID3v2 parsing ───────────────────────────────────────────────────────

function splitEncodedStrings(b) {
  if (!b.length) return []
  let enc = b[0], data = b.subarray(1)
  let out = []
  if (enc === 1 || enc === 2) {
    let start = 0
    if (enc === 1 && data.length >= 2 && ((data[0] === 0xFF && data[1] === 0xFE) || (data[0] === 0xFE && data[1] === 0xFF))) start = 2
    let i = start
    for (let j = start; j < data.length - 1; j += 2) {
      if (data[j] === 0 && data[j + 1] === 0) {
        let td = new TextDecoder(enc === 1 ? (start === 2 && data[0] === 0xFE ? 'utf-16be' : 'utf-16le') : 'utf-16be')
        out.push(td.decode(data.subarray(i, j)))
        i = j + 2
      }
    }
    if (i < data.length) {
      let td = new TextDecoder(enc === 1 ? (start === 2 && data[0] === 0xFE ? 'utf-16be' : 'utf-16le') : 'utf-16be')
      out.push(td.decode(data.subarray(i, data.length - (data[data.length - 1] === 0 && data[data.length - 2] === 0 ? 2 : 0))))
    }
  } else {
    let i = 0
    for (let j = 0; j < data.length; j++) {
      if (data[j] === 0) { out.push(str(data.subarray(i, j), enc === 3 ? 'utf-8' : 'iso-8859-1')); i = j + 1 }
    }
    if (i < data.length) out.push(str(data.subarray(i), enc === 3 ? 'utf-8' : 'iso-8859-1'))
  }
  return out
}

function parseApic(body) {
  let enc = body[0], i = 1
  let mime = '', desc = ''
  while (i < body.length && body[i] !== 0) i++
  mime = str(body.subarray(1, i), 'iso-8859-1')
  i++
  let type = body[i++]
  let descStart = i
  if (enc === 1 || enc === 2) {
    while (i + 1 < body.length && !(body[i] === 0 && body[i + 1] === 0)) i += 2
    desc = enc === 1 ? new TextDecoder('utf-16le').decode(body.subarray(descStart, i)) : new TextDecoder('utf-16be').decode(body.subarray(descStart, i))
    i += 2
  } else {
    while (i < body.length && body[i] !== 0) i++
    desc = str(body.subarray(descStart, i), enc === 3 ? 'utf-8' : 'iso-8859-1')
    i++
  }
  let data = body.slice(i)
  return { mime, type, description: desc, data }
}

/** Parse ID3v2 tag. Returns {meta, size, markers: [], regions: []} or null. */
export function parseId3v2(bytes) {
  if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null
  let ver = bytes[3], flags = bytes[5], size = synchsafe(bytes, 6)
  let end = Math.min(10 + size, bytes.length)
  let meta = {}, raw = { version: ver, frames: [] }, pictures = []
  let headerSize = ver === 2 ? 6 : 10
  let sizeFn = ver >= 4 ? synchsafe : (b, o) => u32be(b, o)
  let off = 10
  if (flags & 0x40) {
    let extSize = ver >= 4 ? synchsafe(bytes, off) : u32be(bytes, off)
    off += extSize + (ver >= 4 ? 0 : 4)
  }
  while (off + headerSize <= end) {
    let id, frameSize
    if (ver === 2) {
      id = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2])
      frameSize = (bytes[off + 3] << 16) | (bytes[off + 4] << 8) | bytes[off + 5]
      off += 6
    } else {
      id = String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3])
      frameSize = sizeFn(bytes, off + 4)
      off += 10
    }
    if (!id.match(/^[A-Z0-9]+$/)) break
    if (frameSize === 0 || off + frameSize > end) break
    let body = bytes.subarray(off, off + frameSize)
    raw.frames.push({ id, body })
    let key = ID3_MAP[id]
    if (id === 'APIC' && body.length > 0) {
      let p = parseApic(body)
      if (p) pictures.push(p)
    } else if (id === 'COMM' || id === 'USLT') {
      if (body.length >= 4) {
        let lang = str(body.subarray(1, 4), 'iso-8859-1')
        let enc = body[0], rest = body.subarray(4)
        let parts = splitEncodedStrings(Uint8Array.from([enc, ...rest]))
        let text = parts[parts.length - 1] || ''
        if (key) meta[key] = text
        if (id === 'COMM') (meta.comments = meta.comments || []).push({ lang, description: parts[0] || '', text })
      }
    } else if (key) {
      let parts = splitEncodedStrings(body)
      meta[key] = parts.join('; ')
    }
    off += frameSize
  }

  meta.raw = raw
  meta.pictures = pictures
  return { meta, size: 10 + size, markers: [], regions: [] }
}

/** Parse MP3 metadata. Returns {meta, markers, regions} or null. */
export function parseMeta(bytes) {
  if (!bytes?.length) return null
  let r = parseId3v2(bytes)
  return r ? { meta: r.meta, markers: r.markers, regions: r.regions } : null
}
