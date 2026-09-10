<script setup lang="ts">
import { AlertTriangle, ArrowLeft, CheckCircle2, Mail, Send } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatValidationMessage } from '~/utils/string/text-format.util'
import { useRequestPasswordResetMutation } from '../composables/usePasswordRecoveryMutations'

defineOptions({ name: 'ForgotPasswordView' })

useHead({ title: 'Recuperar contraseña · Sistema' })

const toast = useAppToast()
const requestPasswordResetMutation = useRequestPasswordResetMutation()
const email = ref('')
const emailError = ref('')
const formError = ref('')
const isSubmitted = ref(false)
const mailServiceError = ref(false)

watch(email, () => {
    emailError.value = ''
    formError.value = ''
    mailServiceError.value = false
})

function applyApiValidation(error: unknown) {
    const details = (error as HttpClientError | undefined)?.details as ApiResponse<null> | undefined
    const message = details?.error?.fields?.email?.[0]
    if (!message) return false

    emailError.value = formatValidationMessage(message)
    return true
}

async function submit() {
    emailError.value = ''
    formError.value = ''
    isSubmitted.value = false
    mailServiceError.value = false

    if (!email.value.trim()) {
        emailError.value = 'Ingresa tu correo electrónico.'
        return
    }

    try {
        await requestPasswordResetMutation.mutateAsync({ email: email.value })
        isSubmitted.value = true
        toast.success('Revisa tu correo electrónico')
    } catch (error) {
        if (applyApiValidation(error)) return

        const httpError = error as HttpClientError | undefined
        if (httpError?.status === 502) {
            mailServiceError.value = true
            formError.value =
                'No se envió el enlace porque el servicio de correos no está disponible.'
            toast.error('No se pudo enviar el correo')
            return
        }

        formError.value = resolveHttpErrorMessage(error, 'No fue posible enviar el enlace')
    }
}
</script>

<template>
    <section class="relative z-10 w-full max-w-[460px]">
        <div class="system-glass-panel rounded-lg p-6 md:p-8">
            <div class="text-center">
                <span
                    class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                    <Mail class="size-6" />
                </span>
                <h1 class="mt-4 font-display text-3xl font-semibold text-on-surface">
                    Recuperar contraseña
                </h1>
                <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    Te enviaremos un enlace para reiniciar tu contraseña.
                </p>
            </div>

            <form class="mt-7 space-y-5" novalidate @submit.prevent="submit">
                <div>
                    <UiLabel for="recovery-email" class="text-xs uppercase text-on-surface-variant">
                        Correo electrónico
                    </UiLabel>
                    <div class="relative mt-2">
                        <Mail
                            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                            :class="emailError ? 'text-destructive' : 'text-on-surface-variant'"
                        />
                        <UiInput
                            id="recovery-email"
                            v-model="email"
                            type="email"
                            autocomplete="email"
                            placeholder="tu@ejemplo.com"
                            class="h-11 bg-surface/70 pl-10"
                            :aria-invalid="!!emailError"
                        />
                    </div>
                    <p v-if="emailError" class="mt-1 text-xs text-destructive">
                        {{ emailError }}
                    </p>
                </div>

                <p
                    v-if="formError"
                    role="alert"
                    aria-live="polite"
                    class="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                    <span class="flex items-start gap-2">
                        <AlertTriangle v-if="mailServiceError" class="mt-0.5 size-4 shrink-0" />
                        <span>{{ formError }}</span>
                    </span>
                </p>

                <div
                    v-if="isSubmitted"
                    aria-live="polite"
                    class="flex items-start gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
                >
                    <CheckCircle2 class="mt-0.5 size-4 shrink-0" />
                    <span>
                        Solicitud procesada. Si el correo pertenece a una cuenta activa, el enlace
                        fue enviado.
                    </span>
                </div>

                <UiButton
                    type="submit"
                    class="h-11 w-full uppercase"
                    :loading="requestPasswordResetMutation.isPending.value"
                >
                    <Send class="size-4" />
                    Enviar enlace
                </UiButton>
            </form>

            <NuxtLink
                to="/login"
                class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
                <ArrowLeft class="size-4" />
                Volver al login
            </NuxtLink>
        </div>
    </section>
</template>
