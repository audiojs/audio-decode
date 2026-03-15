/**
 * Browser test for audio-decode
 * Bundles with esbuild, serves locally, runs in headless Chromium via Playwright.
 *
 * node test.browser.js
 */
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { chromium } from 'playwright'

const __dir = dirname(fileURLToPath(import.meta.url))
const tmp = join(__dir, '.browser-test')

function b64(path) {
	try { return readFileSync(join(__dir, path)).toString('base64') }
	catch { return null }
}

let fixtures = {}
for (let [k, p] of Object.entries({
	wav: join('..', 'audio-lena', 'lena.wav'),
	mp3: join('..', 'audio-lena', 'lena.mp3'),
	aiff: join('..', 'audio-lena', 'lena.aiff'),
	caf: join('..', 'audio-lena', 'lena.caf'),
	wma: join('..', 'audio-lena', 'lena.wma'),
	webm: join('..', 'audio-lena', 'lena.webm'),
})) {
	let v = b64(p)
	if (v) fixtures[k] = v
}

mkdirSync(tmp, { recursive: true })

writeFileSync(join(tmp, 'entry.js'), `
import decode, { decoders } from '../audio-decode.js'

function b64u8(s) {
	let b = atob(s), u = new Uint8Array(b.length)
	for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i)
	return u
}

;(async () => {
	let pass = 0, fail = 0
	function ok(c, m) { c ? (pass++, console.log('ok ' + m)) : (fail++, console.log('FAIL ' + m)) }

	ok(typeof decode === 'function', 'decode is function')
	ok(typeof decoders === 'object', 'decoders is object')
	for (let k of ['wav','mp3','aiff','caf','wma','webm','amr','flac','opus','oga','m4a','qoa','aac'])
		ok(typeof decoders[k] === 'function', 'decoders.' + k + ' exists')

	for (let [fmt, b64] of Object.entries(window.__fixtures)) {
		try {
			let r = await decode(b64u8(b64))
			ok(r.channelData.length >= 1, fmt + ': ch=' + r.channelData.length)
			ok(r.sampleRate > 0, fmt + ': sr=' + r.sampleRate)
			ok(r.channelData[0].length > 1000, fmt + ': samples=' + r.channelData[0].length)
			let bad = 0
			for (let i = 0; i < Math.min(1000, r.channelData[0].length); i++)
				if (!isFinite(r.channelData[0][i])) bad++
			ok(bad === 0, fmt + ': no NaN/Inf')
		} catch(e) {
			ok(false, fmt + ': ' + e.message)
		}
	}

	console.log('RESULT ' + pass + ' ' + fail)
})()
`)

console.log('bundling...')
execSync(`esbuild ${join(tmp, 'entry.js')} --bundle --format=esm --outfile=${join(tmp, 'bundle.js')} --platform=browser`, { stdio: 'inherit' })

writeFileSync(join(tmp, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>window.__fixtures = ${JSON.stringify(fixtures)}</script>
<script type="module" src="bundle.js"></script>
</body></html>`)

let server = createServer((req, res) => {
	let p = req.url === '/' ? '/index.html' : req.url
	try {
		let d = readFileSync(join(tmp, p.slice(1)))
		res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'application/javascript' : 'text/html' })
		res.end(d)
	} catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, r))
let port = server.address().port

let browser = await chromium.launch({ headless: true })
let pass = 0, fail = 0
try {
	let page = await browser.newPage()
	let logs = []

	page.on('console', msg => {
		let t = msg.text()
		logs.push(t)
		if (t.startsWith('ok ')) console.log('  ' + t)
		else if (t.startsWith('FAIL ')) console.log('  ' + t)
	})
	page.on('pageerror', e => { console.log('  PAGE ERROR: ' + e.message); fail++ })

	await page.goto(`http://localhost:${port}/`)

	// Wait for RESULT line
	for (let i = 0; i < 120; i++) {
		await new Promise(r => setTimeout(r, 500))
		if (logs.some(l => l.startsWith('RESULT '))) break
	}

	let done = logs.find(l => l.startsWith('RESULT '))
	if (done) {
		let parts = done.split(' ')
		pass = +parts[1]; fail = +parts[2]
	} else {
		console.log('  TIMEOUT — no RESULT received')
		fail = 1
	}
} finally {
	await browser.close()
	server.close()
	rmSync(tmp, { recursive: true, force: true })
}

console.log(`\n${pass + fail} browser tests, ${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
