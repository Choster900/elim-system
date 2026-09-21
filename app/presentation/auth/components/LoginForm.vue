<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, Mail } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import SecurityCodeInput from '~/presentation/shared/components/SecurityCodeInput.vue'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatValidationMessage } from '~/utils/string/text-format.util'
import { useInvitationQuery } from '../composables/useInvitationQuery'
import { useLoginMutation, useVerifyMfaLoginMutation } from '../composables/useLoginMutation'
import type { LoginResponse, MfaLoginChallenge } from '../interfaces/login-response.interface'
import { useAuthStore } from '../stores/auth.store'

defineOptions({ name: 'AuthLoginForm' })

type FieldKey = 'email' | 'password'

const route = useRoute()
const invitationToken = computed(() =>
    typeof route.query.invitation === 'string' ? route.query.invitation.trim() : '',
)
const invitationQuery = useInvitationQuery(invitationToken)

const form = reactive<Record<FieldKey, string>>({
    email: '',
    password: '',
})

const fieldErrors = reactive<Record<FieldKey, string | null>>({
    email: null,
    password: null,
})

const formError = ref<string | null>(null)
const showPassword = ref(false)
const rememberEmail = ref(false)
const toast = useAppToast()
const loginMutation = useLoginMutation()
const verifyMfaMutation = useVerifyMfaLoginMutation()
const authStore = useAuthStore()
const challenge = ref<MfaLoginChallenge | null>(null)
const mfaCode = ref('')
const isUsingRecoveryCode = ref(false)
const mfaCodeLength = computed(() => {
    if (challenge.value?.method === 'EMAIL') return 8
    return isUsingRecoveryCode.value ? 16 : 6
})

const isLoading = computed(() => loginMutation.isPending.value || verifyMfaMutation.isPending.value)
const hasInvitation = computed(() => !!invitationToken.value)
const invitationError = computed(() => {
    if (!hasInvitation.value) return ''
    if (invitationToken.value.length < 32) return 'El enlace de invitación está incompleto.'
    if (!invitationQuery.error.value) return ''
    return resolveHttpErrorMessage(
        invitationQuery.error.value,
        'La invitación expiró, fue utilizada o no es válida.',
    )
})

watch(
    () => invitationQuery.data.value,
    (invitation) => {
        if (invitation) form.email = invitation.email
    },
    { immediate: true },
)

// El precargado ocurre después del montaje para que el HTML del servidor,
// que no ve localStorage, coincida con el primer render del cliente.
onMounted(() => {
    if (hasInvitation.value || !authStore.rememberedEmail) return

    rememberEmail.value = true
    form.email = authStore.rememberedEmail
})

watch(
    () => form.email,
    () => {
        fieldErrors.email = null
        formError.value = null
    },
)
watch(
    () => form.password,
    () => {
        fieldErrors.password = null
        formError.value = null
    },
)

function applyValidationErrors(apiResponse: ApiResponse<null> | undefined) {
    const fields = apiResponse?.error?.fields
    if (!fields) return false

    let applied = false
    for (const key of Object.keys(fields) as FieldKey[]) {
        const messages = fields[key]
        if (key in fieldErrors && messages?.length) {
            fieldErrors[key] = formatValidationMessage(messages[0]!)
            applied = true
        }
    }
    return applied
}

function safeRedirect() {
    const requestedRedirect =
        typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    return requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
        ? requestedRedirect
        : '/dashboard'
}

async function finishLogin(result: LoginResponse) {
    authStore.setUser(result.user, result.tokens.accessTokenExpiresIn)

    if (rememberEmail.value) {
        authStore.setRememberedEmail(form.email)
    } else {
        authStore.clearRememberedEmail()
    }

    if (result.user.mustChangePassword) {
        toast.info('Crea una contraseña propia para continuar')
        await navigateTo({ path: '/cambiar-clave', query: { redirect: safeRedirect() } })
        return
    }

    toast.success('Inicio de sesión exitoso')
    await navigateTo(safeRedirect())
}

async function verifySecondFactor() {
    formError.value = null
    if (!challenge.value) return
    try {
        const result = await verifyMfaMutation.mutateAsync({
            challengeToken: challenge.value.challengeToken,
            code: mfaCode.value.trim(),
        })
        await finishLogin(result)
    } catch (error) {
        formError.value = resolveHttpErrorMessage(error, 'El código no pudo verificarse')
    }
}

function backToPassword() {
    challenge.value = null
    mfaCode.value = ''
    isUsingRecoveryCode.value = false
    formError.value = null
}

function toggleRecoveryCode() {
    isUsingRecoveryCode.value = !isUsingRecoveryCode.value
    mfaCode.value = ''
    formError.value = null
}

async function onSubmit() {
    fieldErrors.email = null
    fieldErrors.password = null
    formError.value = null

    if (hasInvitation.value && (!invitationQuery.data.value || invitationError.value)) {
        formError.value = invitationError.value || 'Espera mientras validamos la invitación.'
        return
    }

    try {
        const result = await loginMutation.mutateAsync({
            email: form.email,
            password: form.password,
            ...(invitationToken.value ? { invitationToken: invitationToken.value } : {}),
        })
        if ('mfaRequired' in result) {
            challenge.value = result
            isUsingRecoveryCode.value = false
            form.password = ''
            return
        }
        await finishLogin(result)
    } catch (error: unknown) {
        const httpError = error as HttpClientError | undefined
        const apiResponse = httpError?.details as ApiResponse<null> | undefined
        const errorCode = apiResponse?.error?.code

        if (errorCode === 'VALIDATION_ERROR' && applyValidationErrors(apiResponse)) return

        if (apiResponse?.error) {
            formError.value =
                apiResponse.error.details ??
                apiResponse.message ??
                resolveHttpErrorMessage(error, 'No fue posible iniciar sesión')
            return
        }

        formError.value = resolveHttpErrorMessage(error, 'No fue posible iniciar sesión')
    }
}
</script>

<template>
    <form v-if="challenge" class="space-y-5" @submit.prevent="verifySecondFactor">
        <div class="text-center">
            <h1 class="font-display text-3xl font-semibold text-on-surface">Verifica tu acceso</h1>
            <p class="mt-2 text-sm text-on-surface-variant">
                {{
                    challenge.method === 'EMAIL'
                        ? `Enviamos un código de 8 dígitos a ${form.email}.`
                        : 'Ingresa el código de tu aplicación autenticadora o uno de recuperación.'
                }}
            </p>
        </div>
        <div>
            <UiLabel for="mfa-code" class="text-xs uppercase text-on-surface-variant">
                {{ isUsingRecoveryCode ? 'Código de recuperación' : 'Código de seguridad' }}
            </UiLabel>
            <SecurityCodeInput
                v-model="mfaCode"
                class="mt-3 justify-center"
                :length="mfaCodeLength"
                :inputmode="challenge.method === 'EMAIL' ? 'numeric' : 'numeric'"
                :disabled="isLoading"
                autofocus
                aria-label="Código de seguridad"
            />
            <button
                v-if="challenge.method === 'TOTP'"
                type="button"
                class="mt-3 w-full text-center text-xs font-semibold text-primary hover:underline"
                @click="toggleRecoveryCode"
            >
                {{
                    isUsingRecoveryCode
                        ? 'Usar código de la app autenticadora'
                        : 'Usar código de recuperación'
                }}
            </button>
        </div>
        <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
        <UiButton type="submit" class="w-full" :loading="isLoading">Verificar e ingresar</UiButton>
        <button
            type="button"
            class="w-full text-center text-sm text-on-surface-variant hover:text-primary"
            @click="backToPassword"
        >
            Volver al inicio de sesión
        </button>
    </form>
    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div class="mb-5 text-center">
            <h1 class="font-display text-3xl font-semibold text-on-surface">
                {{ hasInvitation ? 'Activa tu cuenta' : 'Bienvenido' }}
            </h1>
            <p class="mt-1 text-sm text-on-surface-variant">
                {{
                    hasInvitation
                        ? 'Ingresa la contraseña temporal recibida por correo'
                        : 'Ingresa a tu comunidad espiritual'
                }}
            </p>
        </div>

        <div
            v-if="hasInvitation && invitationQuery.isPending.value"
            class="rounded border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-on-surface-variant"
        >
            Validando el enlace de invitación…
        </div>
        <div
            v-else-if="hasInvitation && invitationQuery.data.value"
            class="flex items-start gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
        >
            <CheckCircle2 class="mt-0.5 size-4 shrink-0" />
            <span>
                Invitación válida para {{ invitationQuery.data.value.displayName }}. Este enlace se
                desactivará después de ingresar.
            </span>
        </div>
        <div
            v-else-if="invitationError"
            class="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
            <AlertTriangle class="mt-0.5 size-4 shrink-0" />
            <span>{{ invitationError }}</span>
        </div>

        <div class="space-y-2">
            <UiLabel for="email" class="text-xs uppercase text-on-surface-variant">
                Correo electrónico
            </UiLabel>
            <div class="relative">
                <Mail
                    class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2"
                    :class="fieldErrors.email ? 'text-destructive' : 'text-on-surface-variant'"
                />
                <UiInput
                    id="email"
                    v-model="form.email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    required
                    autocomplete="email"
                    :readonly="hasInvitation"
                    :aria-invalid="!!fieldErrors.email"
                    aria-describedby="email-error"
                    class="h-11 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                    :class="
                        fieldErrors.email
                            ? 'border-destructive focus-visible:border-destructive'
                            : 'focus-visible:border-primary'
                    "
                />
            </div>
            <p v-if="fieldErrors.email" id="email-error" class="text-xs text-destructive">
                {{ fieldErrors.email }}
            </p>
        </div>

        <div class="space-y-2">
            <div class="flex items-center justify-between gap-4">
                <UiLabel for="password" class="text-xs uppercase text-on-surface-variant">
                    {{ hasInvitation ? 'Contraseña temporal' : 'Contraseña' }}
                </UiLabel>
            </div>
            <div class="relative">
                <Lock
                    class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2"
                    :class="fieldErrors.password ? 'text-destructive' : 'text-on-surface-variant'"
                />
                <UiInput
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    :aria-invalid="!!fieldErrors.password"
                    aria-describedby="password-error"
                    class="h-11 rounded-none border-x-0 border-t-0 bg-transparent px-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                    :class="
                        fieldErrors.password
                            ? 'border-destructive focus-visible:border-destructive'
                            : 'focus-visible:border-primary'
                    "
                />
                <button
                    type="button"
                    class="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="showPassword = !showPassword"
                >
                    <EyeOff v-if="showPassword" class="size-5" />
                    <Eye v-else class="size-5" />
                </button>
            </div>
            <p v-if="fieldErrors.password" id="password-error" class="text-xs text-destructive">
                {{ fieldErrors.password }}
            </p>
        </div>

        <label
            v-if="!hasInvitation"
            class="flex cursor-pointer items-center gap-2.5 pt-1 text-on-surface-variant"
        >
            <input v-model="rememberEmail" type="checkbox" class="size-4 accent-primary" />
            <span class="text-xs">Recordar mi correo en este dispositivo</span>
        </label>

        <div v-if="!hasInvitation" class="text-right">
            <NuxtLink
                to="/recuperar-clave"
                class="text-xs font-semibold text-primary hover:underline"
            >
                ¿Olvidaste tu contraseña?
            </NuxtLink>
        </div>

        <div
            v-if="formError"
            role="alert"
            class="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
            {{ formError }}
        </div>

        <div class="pt-2">
            <UiButton
                type="submit"
                class="h-11 w-full rounded text-xs uppercase"
                :loading="isLoading"
                :disabled="hasInvitation && !invitationQuery.data.value"
            >
                {{ hasInvitation ? 'Activar e ingresar' : 'Iniciar sesión' }}
            </UiButton>
        </div>

        <div class="border-t border-outline-variant pt-4 text-center">
            <p class="font-display text-sm italic leading-relaxed text-on-surface-variant">
                «Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.»
            </p>
            <p class="mt-2 text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                Mateo 11:28
            </p>
        </div>
    </form>
</template>
