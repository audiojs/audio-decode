/**
 * Browser test runner — serves files, launches headless Chromium via Playwright, captures tst output.
 */
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { extname, normalize, resolve, sep } from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

let root = fileURLToPath(new URL('.', import.meta.url)).replace(/\/+$/, '')

let types = {
	'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
	'.wasm': 'application/wasm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg', '.flac': 'audio/flac', '.opus': 'audio/opus',
	'.aac': 'audio/aac', '.m4a': 'audio/mp4', '.aiff': 'audio/aiff',
	'.caf': 'audio/x-caf', '.webm': 'audio/webm', '.amr': 'audio/amr',
	'.wma': 'audio/x-ms-wma', '.qoa': 'application/octet-stream',
}

let server = createServer(async (req, res) => {
	let rel = normalize(req.url === '/' ? 'test.html' : req.url.split('?')[0]).replace(/^\//, '')
	let path = resolve(root, rel)
	if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
	try {
		res.writeHead(200, {
			'content-type': types[extname(path)] || 'application/octet-stream',
			'cross-origin-opener-policy': 'same-origin',
			'cross-origin-embedder-policy': 'require-corp'
		})
		res.end(await readFile(path))
	} catch {
		res.writeHead(404); res.end('404')
	}
})

await new Promise(r => server.listen(0, r))
let port = server.address().port
console.log(`Server on http://localhost:${port}`)

let browser = await chromium.launch()
let page = await browser.newPage()

let failed = false, earlyExit

page.on('console', msg => {
	let text = msg.text()
	let clean = text.replace(/%c/g, '').replace(/ color: #[0-9a-f]+/gi, '').replace(/ color: \w+/gi, '').trim()
	if (clean && clean !== 'console.groupEnd') process.stdout.write(clean + '\n')
})

page.on('pageerror', err => {
	console.error('PAGE ERROR:', err.message)
	failed = true
	earlyExit?.()
})

let done = new Promise(resolve => {
	earlyExit = resolve
	page.on('console', msg => {
		let text = msg.text()
		if (text.includes('# fail')) failed = true
		if (text.includes('# total')) setTimeout(resolve, 500)
	})
})

try {
	await page.goto(`http://localhost:${port}`)
	await Promise.race([done, new Promise((_, r) => setTimeout(() => r(new Error('Browser tests timed out (120s)')), 120000))])
} catch (e) {
	console.error(e.message)
	failed = true
} finally {
	await browser.close()
	server.close()
}
process.exit(failed ? 1 : 0)
