import 'dotenv/config'
import { createServer } from 'node:net'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const DEFAULT_PORT = 3000
const MAX_PORT = 3099
const DEFAULT_APP_BASE_URL = `http://127.0.0.1:${DEFAULT_PORT}`

function parsePort(value) {
    if (!value) return null

    const port = Number(value)

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`PORT debe ser un numero entero entre 1 y 65535. Valor recibido: ${value}`)
    }

    return port
}

function isPortAvailable(port, host = '0.0.0.0') {
    return new Promise((resolve) => {
        const server = createServer()

        server.once('error', () => resolve(false))
        server.once('listening', () => {
            server.close(() => resolve(true))
        })
        server.listen(port, host)
    })
}

async function resolvePort() {
    const forcedPort = parsePort(process.env.PORT)

    if (forcedPort) {
        if (await isPortAvailable(forcedPort)) return forcedPort

        throw new Error(
            `PORT=${forcedPort} esta ocupado. Libera ese puerto o elimina PORT para usar uno disponible.`,
        )
    }

    for (let port = DEFAULT_PORT; port <= MAX_PORT; port += 1) {
        if (await isPortAvailable(port)) return port
    }

    throw new Error(`No hay puertos disponibles entre ${DEFAULT_PORT} y ${MAX_PORT}.`)
}

let port

try {
    port = await resolvePort()
} catch (error) {
    console.error(`[dev] ${error.message}`)
    process.exit(1)
}

const nuxtCli = fileURLToPath(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url))
const appBaseUrl =
    !process.env.APP_BASE_URL || process.env.APP_BASE_URL === DEFAULT_APP_BASE_URL
        ? `http://127.0.0.1:${port}`
        : process.env.APP_BASE_URL

console.log(`[dev] Nuxt se iniciara en el puerto ${port}. Usa PORT=<puerto> para forzarlo.`)

const child = spawn(process.execPath, [nuxtCli, 'dev'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        APP_BASE_URL: appBaseUrl,
        PORT: String(port),
    },
})

let isShuttingDown = false

function shutdown(signal) {
    isShuttingDown = true

    if (process.platform === 'win32' && child.pid) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
        setTimeout(() => process.exit(0), 5000).unref()
        return
    }

    if (!child.killed) {
        child.kill(signal)
    }

    setTimeout(() => process.exit(0), 5000).unref()
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))

child.on('exit', (code, signal) => {
    process.exit(isShuttingDown ? 0 : (code ?? (signal ? 1 : 0)))
})

child.on('error', (error) => {
    console.error(`[dev] No se pudo iniciar Nuxt: ${error.message}`)
    process.exit(1)
})
