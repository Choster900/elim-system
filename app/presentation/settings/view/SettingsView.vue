<script setup lang="ts">
import QRCode from 'qrcode'
import { Download, KeyRound, Mail, ShieldCheck, Smartphone } from '@lucide/vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import SecurityCodeInput from '~/presentation/shared/components/SecurityCodeInput.vue'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import {
    useConfirmEmailSetupMutation,
    useConfirmTotpSetupMutation,
    useDisableMfaMutation,
    useStartEmailDisableMutation,
    useStartEmailSetupMutation,
    useStartTotpSetupMutation,
} from '../composables/useMfaMutations'
import { useMfaSettingsQuery } from '../composables/useMfaSettings'
import type { MfaChallenge, TotpSetup } from '../interfaces/mfa.interface'

defineOptions({ name: 'SettingsView' })
useHead({ title: 'Configuración de seguridad · Elim' })

const authStore = useAuthStore()
const settingsQuery = useMfaSettingsQuery()
const startTotpSetupMutation = useStartTotpSetupMutation()
const confirmTotpSetupMutation = useConfirmTotpSetupMutation()
const startEmailSetupMutation = useStartEmailSetupMutation()
const confirmEmailSetupMutation = useConfirmEmailSetupMutation()
const startEmailDisableMutation = useStartEmailDisableMutation()
const disableMfaMutation = useDisableMfaMutation()

const selectedMethod = ref<'TOTP' | 'EMAIL'>('TOTP')
const password = ref('')
const code = ref('')
const challenge = ref<MfaChallenge | null>(null)
const flow = ref<'totp-setup' | 'email-setup' | 'email-disable' | null>(null)
const totpSetup = ref<TotpSetup | null>(null)
const qrDataUrl = ref('')
const recoveryCodes = ref<string[]>([])
const isUsingRecoveryCode = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const primaryButtonClass =
    'inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
const outlineButtonClass =
    'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-outline-variant px-3 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'

const status = computed(() => settingsQuery.data.value ?? null)
const loading = computed(() => settingsQuery.isPending.value)
const busy = computed(
    () =>
        startTotpSetupMutation.isPending.value ||
        confirmTotpSetupMutation.isPending.value ||
        startEmailSetupMutation.isPending.value ||
        confirmEmailSetupMutation.isPending.value ||
        startEmailDisableMutation.isPending.value ||
        disableMfaMutation.isPending.value,
)
const methodLabel = computed(() => {
    if (!status.value || status.value.method === 'NONE') return 'Desactivado'
    return status.value.method === 'TOTP' ? 'Aplicación autenticadora' : 'Código por correo'
})

const codeLength = computed(() => (flow.value?.includes('email') ? 8 : 6))
const disableTotpCodeLength = computed(() => (isUsingRecoveryCode.value ? 16 : 6))

watch(
    () => settingsQuery.error.value,
    (error) => {
        if (!error) return
        errorMessage.value = resolveHttpErrorMessage(error, 'No se pudo cargar la configuración')
    },
    { immediate: true },
)

function clearNotices() {
    errorMessage.value = ''
    successMessage.value = ''
}

function toggleRecoveryCode() {
    isUsingRecoveryCode.value = !isUsingRecoveryCode.value
    code.value = ''
    clearNotices()
}

function downloadRecoveryCodes() {
    if (!recoveryCodes.value.length) return

    const content = [
        'Codigos de recuperacion - Elim System',
        `Generados: ${new Date().toLocaleString()}`,
        '',
        ...recoveryCodes.value,
        '',
        'Cada codigo se puede usar una sola vez.',
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'elim-codigos-recuperacion.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

async function startSetup() {
    clearNotices()
    if (!password.value.trim()) {
        errorMessage.value = 'Ingresa tu contraseña actual.'
        return
    }

    try {
        if (selectedMethod.value === 'TOTP') {
            totpSetup.value = await startTotpSetupMutation.mutateAsync({
                password: password.value,
            })
            qrDataUrl.value = await QRCode.toDataURL(totpSetup.value.otpauthUri, {
                width: 184,
                margin: 1,
            })
            flow.value = 'totp-setup'
        } else {
            challenge.value = await startEmailSetupMutation.mutateAsync({
                password: password.value,
            })
            flow.value = 'email-setup'
            successMessage.value = 'Enviamos un código a tu correo. Vence en 5 minutos.'
        }
        password.value = ''
        code.value = ''
    } catch (error) {
        errorMessage.value = resolveHttpErrorMessage(error, 'No se pudo iniciar la configuración')
    }
}

async function confirmSetup() {
    clearNotices()
    if (!code.value.trim()) {
        errorMessage.value = 'Ingresa el código de verificación.'
        return
    }

    try {
        if (flow.value === 'totp-setup') {
            recoveryCodes.value = (
                await confirmTotpSetupMutation.mutateAsync(code.value.trim())
            ).recoveryCodes
            flow.value = null
            totpSetup.value = null
            qrDataUrl.value = ''
            authStore.clearUser()
            successMessage.value = 'TOTP activado. Guarda estos códigos antes de volver a ingresar.'
        } else if (flow.value === 'email-setup' && challenge.value) {
            await confirmEmailSetupMutation.mutateAsync({
                challengeToken: challenge.value.challengeToken,
                code: code.value.trim(),
            })
            authStore.clearUser()
            await navigateTo('/login')
        }
        code.value = ''
    } catch (error) {
        errorMessage.value = resolveHttpErrorMessage(error, 'El código no pudo verificarse')
    }
}

async function startEmailDisable() {
    clearNotices()
    if (!password.value.trim()) {
        errorMessage.value = 'Ingresa tu contraseña actual.'
        return
    }

    try {
        challenge.value = await startEmailDisableMutation.mutateAsync({
            password: password.value,
        })
        password.value = ''
        code.value = ''
        isUsingRecoveryCode.value = false
        flow.value = 'email-disable'
        successMessage.value = 'Enviamos un código a tu correo para confirmar el cambio.'
    } catch (error) {
        errorMessage.value = resolveHttpErrorMessage(error, 'No se pudo enviar el código')
    }
}

async function disableFactor() {
    clearNotices()
    if (!code.value.trim()) {
        errorMessage.value = 'Ingresa el código de seguridad.'
        return
    }

    try {
        await disableMfaMutation.mutateAsync({
            code: code.value.trim(),
            ...(status.value?.method === 'TOTP' ? { password: password.value } : {}),
            ...(flow.value === 'email-disable' && challenge.value
                ? { challengeToken: challenge.value.challengeToken }
                : {}),
        })
        isUsingRecoveryCode.value = false
        authStore.clearUser()
        await navigateTo('/login')
    } catch (error) {
        errorMessage.value = resolveHttpErrorMessage(error, 'No se pudo desactivar el factor')
    }
}
</script>

<template>
    <main class="mx-auto w-full max-w-5xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Mi cuenta
                </p>
                <h1 class="mt-2 font-display text-3xl font-semibold text-on-surface">Seguridad</h1>
            </div>
            <div
                v-if="status"
                class="rounded-md border border-outline-variant bg-card px-4 py-3 text-sm"
            >
                <span class="text-on-surface-variant">Método actual</span>
                <strong class="ml-2 text-on-surface">{{ methodLabel }}</strong>
            </div>
        </div>

        <div class="space-y-3">
            <div
                v-if="errorMessage"
                role="alert"
                class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
                {{ errorMessage }}
            </div>
            <div
                v-if="successMessage"
                role="status"
                class="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
                {{ successMessage }}
            </div>
        </div>

        <UiCard v-if="loading" class="mt-5 p-5 text-sm text-on-surface-variant">
            Cargando seguridad de la cuenta…
        </UiCard>

        <UiCard v-else-if="recoveryCodes.length" class="mt-5 p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="max-w-xl">
                    <div class="flex items-center gap-3">
                        <span class="rounded-md bg-primary/10 p-2 text-primary">
                            <ShieldCheck class="size-5" />
                        </span>
                        <div>
                            <h2 class="font-display text-2xl font-semibold text-on-surface">
                                Códigos de recuperación
                            </h2>
                            <p class="mt-1 text-sm text-on-surface-variant">
                                Guárdalos ahora. No volverán a mostrarse.
                            </p>
                        </div>
                    </div>
                    <div
                        class="mt-4 grid gap-2 rounded-md border border-outline-variant bg-surface p-4 font-mono text-sm text-on-surface sm:grid-cols-2"
                    >
                        <span v-for="item in recoveryCodes" :key="item">{{ item }}</span>
                    </div>
                </div>
                <div class="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                        type="button"
                        :class="primaryButtonClass"
                        @click="downloadRecoveryCodes"
                    >
                        <Download class="size-4" />
                        Descargar códigos
                    </button>
                    <button type="button" :class="outlineButtonClass" @click="navigateTo('/login')">
                        Ya los guardé
                    </button>
                </div>
            </div>
        </UiCard>

        <UiCard v-else-if="status" class="mt-5 overflow-hidden">
            <section class="grid gap-0 lg:grid-cols-[1fr_18rem]">
                <div class="space-y-5 p-5 sm:p-6">
                    <div class="flex items-start gap-3">
                        <span class="rounded-md bg-primary/10 p-2 text-primary">
                            <ShieldCheck class="size-5" />
                        </span>
                        <div>
                            <h2 class="font-display text-2xl font-semibold text-on-surface">
                                Verificación en dos pasos
                            </h2>
                            <p class="mt-1 text-sm text-on-surface-variant">
                                Confirma tu identidad después de iniciar sesión.
                            </p>
                        </div>
                    </div>

                    <div v-if="status.method === 'NONE'" class="space-y-5">
                        <div class="grid gap-2 md:grid-cols-3">
                            <button
                                type="button"
                                class="rounded-md border p-3 text-left transition"
                                :class="
                                    selectedMethod === 'TOTP'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-outline-variant hover:border-primary/60'
                                "
                                :disabled="!!flow"
                                @click="selectedMethod = 'TOTP'"
                            >
                                <KeyRound class="mb-2 size-4 text-primary" />
                                <span class="block text-sm font-semibold text-on-surface">
                                    Aplicación TOTP
                                </span>
                                <span class="mt-1 block text-xs text-on-surface-variant">
                                    Google Authenticator, Microsoft Authenticator o similar.
                                </span>
                            </button>
                            <button
                                type="button"
                                class="rounded-md border p-3 text-left transition"
                                :class="
                                    selectedMethod === 'EMAIL'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-outline-variant hover:border-primary/60'
                                "
                                :disabled="!!flow"
                                @click="selectedMethod = 'EMAIL'"
                            >
                                <Mail class="mb-2 size-4 text-primary" />
                                <span class="block text-sm font-semibold text-on-surface">
                                    Correo
                                </span>
                                <span class="mt-1 block text-xs text-on-surface-variant">
                                    Código enviado a {{ status.email }}.
                                </span>
                            </button>
                            <div
                                class="rounded-md border border-dashed border-outline-variant p-3 opacity-60"
                            >
                                <Smartphone class="mb-2 size-4" />
                                <span class="block text-sm font-semibold text-on-surface">
                                    Teléfono
                                </span>
                                <span class="mt-1 block text-xs text-on-surface-variant">
                                    Próximamente con proveedor SMS.
                                </span>
                            </div>
                        </div>

                        <div
                            v-if="!flow"
                            class="flex flex-col gap-3 rounded-md border border-outline-variant bg-surface/60 p-4 sm:flex-row sm:items-end"
                        >
                            <div class="w-full max-w-sm">
                                <label
                                    for="mfa-current-password"
                                    class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                >
                                    Contraseña actual
                                </label>
                                <UiInput
                                    id="mfa-current-password"
                                    v-model="password"
                                    type="password"
                                    autocomplete="current-password"
                                    class="mt-2"
                                />
                            </div>
                            <button
                                type="button"
                                :class="primaryButtonClass"
                                :disabled="busy"
                                @click="startSetup"
                            >
                                {{
                                    busy
                                        ? 'Procesando…'
                                        : `Configurar ${
                                              selectedMethod === 'TOTP' ? 'TOTP' : 'correo'
                                          }`
                                }}
                            </button>
                        </div>

                        <div
                            v-else-if="flow === 'totp-setup' && totpSetup"
                            class="grid gap-4 rounded-md border border-primary/25 bg-primary/5 p-4 lg:grid-cols-[12rem_1fr]"
                        >
                            <div>
                                <img
                                    v-if="qrDataUrl"
                                    :src="qrDataUrl"
                                    alt="Código QR para configurar TOTP"
                                    class="rounded-md bg-white p-2"
                                    width="184"
                                    height="184"
                                />
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <h3 class="font-semibold text-on-surface">
                                        Escanea el QR y confirma el código
                                    </h3>
                                    <p class="mt-1 text-sm text-on-surface-variant">
                                        Clave manual:
                                    </p>
                                    <code class="mt-1 block break-all text-xs text-primary">
                                        {{ totpSetup.secret }}
                                    </code>
                                </div>
                                <div>
                                    <label
                                        class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        Código de 6 dígitos
                                    </label>
                                    <SecurityCodeInput
                                        v-model="code"
                                        class="mt-2"
                                        :length="6"
                                        :disabled="busy"
                                        aria-label="Código TOTP"
                                    />
                                </div>
                                <button
                                    type="button"
                                    :class="primaryButtonClass"
                                    :disabled="busy"
                                    @click="confirmSetup"
                                >
                                    {{ busy ? 'Procesando…' : 'Activar TOTP' }}
                                </button>
                            </div>
                        </div>

                        <div
                            v-else-if="flow === 'email-setup'"
                            class="space-y-4 rounded-md border border-primary/25 bg-primary/5 p-4"
                        >
                            <div>
                                <label
                                    class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                >
                                    Código recibido por correo
                                </label>
                                <SecurityCodeInput
                                    v-model="code"
                                    class="mt-2"
                                    :length="codeLength"
                                    inputmode="numeric"
                                    :disabled="busy"
                                    aria-label="Código recibido por correo"
                                />
                            </div>
                            <button
                                type="button"
                                :class="primaryButtonClass"
                                :disabled="busy"
                                @click="confirmSetup"
                            >
                                {{ busy ? 'Procesando…' : 'Activar correo' }}
                            </button>
                        </div>
                    </div>

                    <div v-else class="space-y-4">
                        <div class="rounded-md border border-outline-variant bg-surface/60 p-4">
                            <h3 class="font-display text-xl text-on-surface">
                                Desactivar o cambiar método
                            </h3>
                            <p class="mt-1 text-sm text-on-surface-variant">
                                Al desactivarlo se cerrará tu sesión para confirmar el cambio.
                            </p>
                        </div>

                        <template v-if="status.method === 'TOTP'">
                            <div class="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
                                <div>
                                    <label
                                        for="mfa-disable-password"
                                        class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        Contraseña actual
                                    </label>
                                    <UiInput
                                        id="mfa-disable-password"
                                        v-model="password"
                                        type="password"
                                        autocomplete="current-password"
                                        class="mt-2"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        {{
                                            isUsingRecoveryCode
                                                ? 'Código de recuperación'
                                                : 'Código TOTP'
                                        }}
                                    </label>
                                    <SecurityCodeInput
                                        v-model="code"
                                        class="mt-2"
                                        :length="disableTotpCodeLength"
                                        :disabled="busy"
                                        aria-label="Código TOTP o de recuperación para desactivar"
                                    />
                                    <button
                                        type="button"
                                        class="mt-3 text-xs font-semibold text-primary hover:underline"
                                        @click="toggleRecoveryCode"
                                    >
                                        {{
                                            isUsingRecoveryCode
                                                ? 'Usar código de la app autenticadora'
                                                : 'Usar código de recuperación'
                                        }}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                :class="outlineButtonClass"
                                :disabled="busy"
                                @click="disableFactor"
                            >
                                {{ busy ? 'Procesando…' : 'Desactivar TOTP' }}
                            </button>
                        </template>

                        <template v-else>
                            <template v-if="flow !== 'email-disable'">
                                <div class="max-w-sm">
                                    <label
                                        for="mfa-disable-password"
                                        class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        Contraseña actual
                                    </label>
                                    <UiInput
                                        id="mfa-disable-password"
                                        v-model="password"
                                        type="password"
                                        autocomplete="current-password"
                                        class="mt-2"
                                    />
                                </div>
                                <button
                                    type="button"
                                    :class="outlineButtonClass"
                                    :disabled="busy"
                                    @click="startEmailDisable"
                                >
                                    {{ busy ? 'Procesando…' : 'Enviar código para desactivar' }}
                                </button>
                            </template>
                            <template v-else>
                                <div>
                                    <label
                                        class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                                    >
                                        Código recibido por correo
                                    </label>
                                    <SecurityCodeInput
                                        v-model="code"
                                        class="mt-2"
                                        :length="8"
                                        :disabled="busy"
                                        aria-label="Código de correo para desactivar"
                                    />
                                </div>
                                <button
                                    type="button"
                                    :class="outlineButtonClass"
                                    :disabled="busy"
                                    @click="disableFactor"
                                >
                                    {{ busy ? 'Procesando…' : 'Confirmar desactivación' }}
                                </button>
                            </template>
                        </template>
                    </div>
                </div>

                <aside
                    class="border-t border-outline-variant bg-surface/50 p-5 lg:border-l lg:border-t-0"
                >
                    <dl class="space-y-4 text-sm">
                        <div>
                            <dt class="text-on-surface-variant">Cuenta</dt>
                            <dd class="mt-1 break-all font-medium text-on-surface">
                                {{ status.email }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-on-surface-variant">Estado</dt>
                            <dd class="mt-1 font-medium text-on-surface">{{ methodLabel }}</dd>
                        </div>
                        <div v-if="status.method === 'TOTP'">
                            <dt class="text-on-surface-variant">Recuperación</dt>
                            <dd class="mt-1 font-medium text-on-surface">
                                {{ status.recoveryCodesRemaining }} códigos disponibles
                            </dd>
                        </div>
                        <div>
                            <dt class="text-on-surface-variant">Teléfono</dt>
                            <dd class="mt-1 font-medium text-on-surface">
                                {{ status.phoneAvailable ? 'Disponible' : 'Pendiente' }}
                            </dd>
                        </div>
                    </dl>
                </aside>
            </section>
        </UiCard>
    </main>
</template>
