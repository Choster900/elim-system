<script setup lang="ts">
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from '@lucide/vue'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatValidationMessage } from '~/utils/string/text-format.util'
import { useChangePasswordMutation } from '../composables/useChangePasswordMutation'
import { useAuthStore } from '../stores/auth.store'

defineOptions({ name: 'ChangePasswordView' })

useHead({ title: 'Cambiar contraseña · Sistema' })

type FieldKey = 'currentPassword' | 'newPassword' | 'confirmPassword'

const route = useRoute()
const authStore = useAuthStore()
const toast = useAppToast()
const changePasswordMutation = useChangePasswordMutation()
const form = reactive<Record<FieldKey, string>>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})
const fieldErrors = reactive<Record<FieldKey, string>>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})
const formError = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const passwordRequirements = computed(() => [
    { label: '10 caracteres', valid: form.newPassword.length >= 10 },
    { label: 'Una mayúscula', valid: /[A-Z]/.test(form.newPassword) },
    { label: 'Una minúscula', valid: /[a-z]/.test(form.newPassword) },
    { label: 'Un número', valid: /[0-9]/.test(form.newPassword) },
    { label: 'Un símbolo', valid: /[^a-zA-Z0-9]/.test(form.newPassword) },
])

function clearErrors() {
    fieldErrors.currentPassword = ''
    fieldErrors.newPassword = ''
    fieldErrors.confirmPassword = ''
    formError.value = ''
}

function validate() {
    clearErrors()
    if (form.currentPassword.length < 8) {
        fieldErrors.currentPassword = 'Ingresa la contraseña temporal recibida por correo.'
    }
    if (passwordRequirements.value.some(({ valid }) => !valid)) {
        fieldErrors.newPassword = 'La contraseña todavía no cumple todos los requisitos.'
    }
    if (form.newPassword === form.currentPassword) {
        fieldErrors.newPassword = 'La contraseña nueva debe ser diferente de la temporal.'
    }
    if (form.confirmPassword !== form.newPassword) {
        fieldErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }
    return !Object.values(fieldErrors).some(Boolean)
}

function applyApiValidation(error: unknown) {
    const details = (error as HttpClientError | undefined)?.details as ApiResponse<null> | undefined
    const fields = details?.error?.fields
    if (!fields) return false

    let applied = false
    for (const key of ['currentPassword', 'newPassword'] as const) {
        if (fields[key]?.[0]) {
            fieldErrors[key] = formatValidationMessage(fields[key][0])
            applied = true
        }
    }
    return applied
}

function safeRedirect() {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    if (
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        !redirect.startsWith('/cambiar-clave')
    ) {
        return redirect
    }
    return '/dashboard'
}

async function submit() {
    if (!validate()) return
    try {
        const result = await changePasswordMutation.mutateAsync({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
        })
        authStore.setUser(result.user, result.tokens.accessTokenExpiresIn)
        toast.success('Contraseña actualizada correctamente')
        await navigateTo(safeRedirect())
    } catch (error) {
        if (applyApiValidation(error)) return
        formError.value = resolveHttpErrorMessage(error, 'No fue posible actualizar la contraseña')
    }
}
</script>

<template>
    <section class="relative z-10 w-full max-w-[520px]">
        <div class="system-glass-panel rounded-lg p-6 md:p-8">
            <div class="text-center">
                <span
                    class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                    <KeyRound class="size-6" />
                </span>
                <p class="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                    Primer acceso
                </p>
                <h1 class="mt-1 font-display text-3xl font-semibold text-on-surface">
                    Crea tu contraseña
                </h1>
                <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    Por seguridad, esta sesión solo permite reemplazar la contraseña temporal antes
                    de continuar al sistema.
                </p>
            </div>

            <form class="mt-7 space-y-5" novalidate @submit.prevent="submit">
                <div>
                    <UiLabel
                        for="current-password"
                        class="text-xs uppercase text-on-surface-variant"
                    >
                        Contraseña temporal
                    </UiLabel>
                    <div class="relative mt-2">
                        <LockKeyhole
                            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                        />
                        <UiInput
                            id="current-password"
                            v-model="form.currentPassword"
                            :type="showCurrentPassword ? 'text' : 'password'"
                            autocomplete="current-password"
                            class="h-11 bg-surface/70 pl-10 pr-10"
                            :aria-invalid="!!fieldErrors.currentPassword"
                        />
                        <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                            :aria-label="
                                showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                            "
                            @click="showCurrentPassword = !showCurrentPassword"
                        >
                            <EyeOff v-if="showCurrentPassword" class="size-4" />
                            <Eye v-else class="size-4" />
                        </button>
                    </div>
                    <p v-if="fieldErrors.currentPassword" class="mt-1 text-xs text-destructive">
                        {{ fieldErrors.currentPassword }}
                    </p>
                </div>

                <div>
                    <UiLabel for="new-password" class="text-xs uppercase text-on-surface-variant">
                        Nueva contraseña
                    </UiLabel>
                    <div class="relative mt-2">
                        <KeyRound
                            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                        />
                        <UiInput
                            id="new-password"
                            v-model="form.newPassword"
                            :type="showNewPassword ? 'text' : 'password'"
                            autocomplete="new-password"
                            class="h-11 bg-surface/70 pl-10 pr-10"
                            :aria-invalid="!!fieldErrors.newPassword"
                        />
                        <button
                            type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                            :aria-label="
                                showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                            "
                            @click="showNewPassword = !showNewPassword"
                        >
                            <EyeOff v-if="showNewPassword" class="size-4" />
                            <Eye v-else class="size-4" />
                        </button>
                    </div>
                    <p v-if="fieldErrors.newPassword" class="mt-1 text-xs text-destructive">
                        {{ fieldErrors.newPassword }}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <span
                            v-for="requirement in passwordRequirements"
                            :key="requirement.label"
                            class="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px]"
                            :class="
                                requirement.valid
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-outline-variant text-on-surface-variant'
                            "
                        >
                            <CheckCircle2 class="size-3" /> {{ requirement.label }}
                        </span>
                    </div>
                </div>

                <div>
                    <UiLabel
                        for="confirm-password"
                        class="text-xs uppercase text-on-surface-variant"
                    >
                        Confirmar nueva contraseña
                    </UiLabel>
                    <UiInput
                        id="confirm-password"
                        v-model="form.confirmPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        autocomplete="new-password"
                        class="mt-2 h-11 bg-surface/70"
                        :aria-invalid="!!fieldErrors.confirmPassword"
                    />
                    <p v-if="fieldErrors.confirmPassword" class="mt-1 text-xs text-destructive">
                        {{ fieldErrors.confirmPassword }}
                    </p>
                </div>

                <p
                    v-if="formError"
                    role="alert"
                    class="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                    {{ formError }}
                </p>

                <UiButton
                    type="submit"
                    class="h-11 w-full uppercase"
                    :loading="changePasswordMutation.isPending.value"
                >
                    Guardar contraseña y continuar
                </UiButton>
            </form>
        </div>
    </section>
</template>
