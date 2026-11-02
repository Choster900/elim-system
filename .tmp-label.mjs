import 'dotenv/config'
import jwt from 'jsonwebtoken'
import pg from 'pg'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const SP = process.env.SP
const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const u = (
    await c.query(
        'select usu_id, usu_correo, usu_version_doble_factor v from usu_usuario where usu_id = 7',
    )
).rows[0]
const permissions = (
    await c.query(
        'select distinct p.per_codigo from uxr_usuario_rol x join rxp_rol_permiso rp on rp.rxp_rol = x.uxr_rol join per_permiso p on p.per_id = rp.rxp_permiso where x.uxr_usuario = 7',
    )
).rows.map((r) => r.per_codigo)
await c.end()
const token = jwt.sign(
    {
        sub: '7',
        email: u.usu_correo,
        roles: ['ADMINISTRATOR'],
        permissions,
        mustChangePassword: false,
        mfaVersion: u.v,
        type: 'access',
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: 600 },
)

const chrome = spawn(
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    [
        '--headless=new',
        '--remote-debugging-port=9333',
        `--user-data-dir=${SP}/chrome-profile`,
        '--hide-scrollbars',
        'about:blank',
    ],
    { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 40 && !target; i++) {
    await sleep(250)
    try {
        target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find(
            (t) => t.type === 'page',
        )
    } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
const writes = []
const send = (method, params = {}) =>
    new Promise((r) => {
        const i = ++id
        pending.set(i, r)
        ws.send(JSON.stringify({ id: i, method, params }))
    })
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m)
        pending.delete(m.id)
        return
    }
    if (m.method === 'Fetch.requestPaused') {
        const { request, requestId } = m.params
        const url = new URL(request.url)
        if (
            request.method !== 'GET' &&
            url.pathname.startsWith('/api/') &&
            !url.pathname.startsWith('/api/auth/')
        ) {
            writes.push(`${request.method} ${url.pathname}`)
            send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' })
            return
        }
        if (url.pathname.endsWith('/offering-receptions/pendientes'))
            url.searchParams.set('page', '2')
        send('Fetch.continueRequest', { requestId, url: url.toString() })
    }
})
const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
        ?.result?.value
const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    writeFileSync(`${SP}/${name}.png`, Buffer.from(r.result.data, 'base64'))
}
const tabsText = () =>
    evaluate(
        `[...document.querySelectorAll('[role=tab]')].map((t) => (t.getAttribute('aria-selected') === 'true' ? '[x] ' : '') + t.innerText.replace(/\\s+/g, ' ').trim()).join(' | ')`,
    )

await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*', requestStage: 'Request' }] })
await send('Network.enable')
await send('Network.setCookie', {
    name: 'access_token',
    value: token,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
})
await send('Page.enable')

await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
})
await send('Page.navigate', {
    url: 'http://127.0.0.1:3000/finanzas/comite-de-apoyo/sobres/40015/contar?modo=corregir',
})
for (let i = 0; i < 60; i++) {
    await sleep(500)
    if (await evaluate(`!!document.querySelector('[role=tab]')`)) break
}
await sleep(1000)
console.log(
    'barra inferior:',
    await evaluate(
        `[...document.querySelectorAll('p')].filter((p) => /^contando en/i.test(p.innerText.trim())).map((p) => p.innerText.trim()).join(' / ')`,
    ),
)
const bar = await evaluate(
    `(() => { const p = [...document.querySelectorAll('p')].filter((x) => /^contando en/i.test(x.innerText.trim())).at(-1); const r = p.getBoundingClientRect(); return { x: r.left - 8, y: r.top - 8, width: r.width + 140, height: r.height + 40 } })()`,
)
const img = await send('Page.captureScreenshot', { format: 'png', clip: { ...bar, scale: 2 } })
writeFileSync(`${SP}/bottom-label.png`, Buffer.from(img.result.data, 'base64'))
console.log('escrituras bloqueadas:', writes.length ? writes : 'ninguna')
ws.close()
chrome.kill()
