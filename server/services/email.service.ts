import nodemailer from 'nodemailer'
import { validateEnv } from '../../config/env'

interface AccessInvitationEmailInput {
    email: string
    displayName: string
    temporaryPassword: string
    invitationToken: string
    expiresAt: Date
    requirePasswordChange: boolean
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function escapeHtml(value: string) {
    return value.replace(
        /[&<>'"]/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
            })[character]!,
    )
}

function getTransporter() {
    if (transporter) return transporter

    const env = validateEnv()
    transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
            env.SMTP_USER && env.SMTP_PASSWORD
                ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
                : undefined,
        disableFileAccess: true,
        disableUrlAccess: true,
    })
    return transporter
}

function buildInvitationUrl(token: string) {
    const env = validateEnv()
    const invitationUrl = new URL('/login', env.APP_BASE_URL)
    invitationUrl.searchParams.set('invitation', token)
    return invitationUrl.toString()
}

export async function sendAccessInvitationEmail(input: AccessInvitationEmailInput) {
    const env = validateEnv()
    const invitationUrl = buildInvitationUrl(input.invitationToken)
    const expiration = new Intl.DateTimeFormat('es-SV', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/El_Salvador',
    }).format(input.expiresAt)
    const safeName = escapeHtml(input.displayName)
    const safePassword = escapeHtml(input.temporaryPassword)
    const safeUrl = escapeHtml(invitationUrl)

    await getTransporter().sendMail({
        from: env.MAIL_FROM,
        to: input.email,
        subject: 'Tu acceso temporal a Elim',
        text: [
            `Hola ${input.displayName},`,
            '',
            'Se creó un acceso para ti en Elim.',
            `Contraseña temporal: ${input.temporaryPassword}`,
            `Enlace de acceso: ${invitationUrl}`,
            `El enlace vence el ${expiration}.`,
            input.requirePasswordChange
                ? 'Después de ingresar deberás establecer una contraseña nueva.'
                : 'El administrador no marcó como obligatorio el cambio en el primer acceso.',
            '',
            'Si no esperabas este correo, comunícate con un administrador.',
        ].join('\n'),
        html: `
            <div style="background:#171713;padding:32px;font-family:Arial,sans-serif;color:#f4efe4">
                <div style="max-width:560px;margin:auto;background:#24231f;border:1px solid #49463d;padding:32px">
                    <p style="margin:0;color:#d9b56d;font-size:12px;letter-spacing:2px;text-transform:uppercase">Elim · Acceso al sistema</p>
                    <h1 style="margin:16px 0 8px;font-family:Georgia,serif;font-size:28px">Hola, ${safeName}</h1>
                    <p style="color:#c9c2b4;line-height:1.6">Un administrador creó un acceso para ti. Utiliza la contraseña temporal y el enlace seguro siguientes.</p>
                    <div style="margin:24px 0;padding:18px;background:#171713;border:1px solid #49463d">
                        <p style="margin:0 0 8px;color:#9e978a;font-size:11px;text-transform:uppercase">Contraseña temporal</p>
                        <code style="font-size:20px;color:#f4efe4">${safePassword}</code>
                    </div>
                    <a href="${safeUrl}" style="display:inline-block;background:#d9b56d;color:#171713;padding:13px 20px;text-decoration:none;font-weight:bold">Ingresar y validar acceso</a>
                    <p style="margin:20px 0 0;color:#c9c2b4;font-size:13px">El enlace vence el <strong>${escapeHtml(expiration)}</strong> y solo puede utilizarse una vez.</p>
                    <p style="margin:8px 0 0;color:#c9c2b4;font-size:13px">${
                        input.requirePasswordChange
                            ? 'Al ingresar se te pedirá crear una contraseña nueva.'
                            : 'El cambio de contraseña no fue marcado como obligatorio.'
                    }</p>
                </div>
            </div>
        `,
    })
}
