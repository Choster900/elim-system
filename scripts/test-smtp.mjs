import 'dotenv/config'
import process from 'node:process'
import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST ?? '127.0.0.1'
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 1025)
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? 'false') === 'true'
const SMTP_USER = process.env.SMTP_USER ?? ''
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? ''
const MAIL_FROM = process.env.MAIL_FROM ?? 'Elim <no-reply@elim.local>'
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000'

const recipient = process.argv[2]

function maskUser(value) {
    if (!value) return '(sin autenticación)'
    const [name, domain] = value.split('@')
    const visible = name.slice(0, 2)
    return domain ? `${visible}***@${domain}` : `${visible}***`
}

if (SMTP_SECURE && SMTP_PORT !== 465) {
    console.warn(
        `[test-smtp] SMTP_SECURE=true con el puerto ${SMTP_PORT}. secure solo aplica al 465; el 587 usa STARTTLS y va en false.`,
    )
}

if (!SMTP_SECURE && SMTP_PORT === 465) {
    console.warn('[test-smtp] El puerto 465 necesita SMTP_SECURE=true.')
}

console.log('[test-smtp] Configuración leída de .env:')
console.log(`  host      ${SMTP_HOST}`)
console.log(`  port      ${SMTP_PORT}`)
console.log(`  secure    ${SMTP_SECURE}`)
console.log(`  user      ${maskUser(SMTP_USER)}`)
console.log(`  from      ${MAIL_FROM}`)
console.log(`  baseUrl   ${APP_BASE_URL}`)

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASSWORD ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
})

try {
    await transporter.verify()
    console.log('[test-smtp] Conexión y credenciales verificadas correctamente.')
} catch (error) {
    console.error(`[test-smtp] Falló la verificación: ${error.message}`)
    process.exit(1)
}

if (!recipient) {
    console.log(
        '[test-smtp] Para enviar un correo de prueba: npm run test:smtp -- tucorreo@dominio.com',
    )
    process.exit(0)
}

try {
    const info = await transporter.sendMail({
        from: MAIL_FROM,
        to: recipient,
        subject: 'Prueba de configuración SMTP · Elim',
        text: `Si estás leyendo esto, la configuración SMTP de Elim funciona.\nEnlaces de invitación se construirán sobre ${APP_BASE_URL}.`,
        html: `<p>Si estás leyendo esto, la configuración SMTP de Elim funciona.</p><p>Los enlaces de invitación se construirán sobre <strong>${APP_BASE_URL}</strong>.</p>`,
    })
    console.log(`[test-smtp] Correo enviado a ${recipient} (messageId: ${info.messageId}).`)
    if (info.rejected?.length) {
        console.warn(`[test-smtp] Destinatarios rechazados: ${info.rejected.join(', ')}`)
    }
} catch (error) {
    console.error(`[test-smtp] Falló el envío: ${error.message}`)
    process.exit(1)
}
