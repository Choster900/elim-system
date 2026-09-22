<script setup lang="ts">
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from '@lucide/vue'
import { useChangePasswordMutation } from '~/presentation/auth/composables/useChangePasswordMutation'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'ChangePasswordCard' })

const authStore = useAuthStore()
const toast = useAppToast()
const changePasswordMutation = useChangePasswordMutation()
const form = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})
const errorMessage = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const passwordRequirements = computed(() => [
    { label: '10 caracteres', valid: form.newPassword.length >= 10 },
    { label: 'Mayúscula', valid: /[A-Z]/.test(form.newPassword) },
    { label: 'Minúscula', valid: /[a-z]/.test(form.newPassword) },
    { label: 'Número', valid: /[0-9]/.test(form.newPassword) },
    { label: 'Símbolo', valid: /[^a-zA-Z0-9]/.test(form.newPassword) },
])

function validate() {
    errorMessage.value = ''
    if (form.currentPassword.length < 8) {
        errorMessage.value = 'Ingresa tu contraseña actual.'
        return false
    }
    if (passwordRequirements.value.some(({ valid }) => !valid)) {
        errorMessage.value = 'La nueva contraseña aún no cumple los requisitos.'
        return false
    }
    if (form.newPassword === form.currentPassword) {
        errorMessage.value = 'La nueva contraseña debe ser diferente de la actual.'
        return false
    }
    if (form.newPassword !== form.confirmPassword) {
        errorMessage.value = 'Las contraseñas nuevas no coinciden.'
        return false
    }
    return true
}

async function submit() {
    if (!validate()) return

    try {
        const result = await changePasswordMutation.mutateAsync({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
        })
        authStore.setUser(result.user, result.tokens.accessTokenExpiresIn)
        form.currentPassword = ''
        form.newPassword = ''
        form.confirmPassword = ''
        toast.success('Contraseña actualizada correctamente')
    } catch (error) {
        errorMessage.value = resolveHttpErrorMessage(
            error,
            'No fue posible actualizar la contraseña',
        )
    }
}
</script>

<template>
    <UiCard class="mt-5 overflow-hidden">
        <section class="grid gap-0 lg:grid-cols-[1fr_18rem]">
            <form class="space-y-4 p-5 sm:p-6" novalidate @submit.prevent="submit">
                <div class="flex items-start gap-3">
                    <span class="rounded-md bg-primary/10 p-2 text-primary">
                        <KeyRound class="size-5" />
                    </span>
                    <div>
                        <h2 class="font-display text-2xl font-semibold text-on-surface">
                            Cambiar contraseña
                        </h2>
                        <p class="mt-1 text-sm text-on-surface-variant">
                            Actualiza tu contraseña sin salir de tu cuenta.
                        </p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div>
                        <UiLabel for="settings-current-password">Contraseña actual</UiLabel>
                        <div class="relative mt-2">
                            <LockKeyhole
                                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                            />
                            <UiInput
                                id="settings-current-password"
                                v-model="form.currentPassword"
                                :type="showCurrentPassword ? 'text' : 'password'"
                                autocomplete="current-password"
                                class="h-10 pl-10 pr-10"
                            />
                            <button
                                type="button"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                                :aria-label="
                                    showCurrentPassword
                                        ? 'Ocultar contraseña'
                                        : 'Mostrar contraseña'
                                "
                                @click="showCurrentPassword = !showCurrentPassword"
                            >
                                <EyeOff v-if="showCurrentPassword" class="size-4" />
                                <Eye v-else class="size-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <UiLabel for="settings-new-password">Nueva contraseña</UiLabel>
                        <div class="relative mt-2">
                            <KeyRound
                                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                            />
                            <UiInput
                                id="settings-new-password"
                                v-model="form.newPassword"
                                :type="showNewPassword ? 'text' : 'password'"
                                autocomplete="new-password"
                                class="h-10 pl-10 pr-10"
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
                    </div>

                    <div class="md:col-span-2">
                        <UiLabel for="settings-confirm-password"
                            >Confirmar nueva contraseña</UiLabel
                        >
                        <UiInput
                            id="settings-confirm-password"
                            v-model="form.confirmPassword"
                            :type="showNewPassword ? 'text' : 'password'"
                            autocomplete="new-password"
                            class="mt-2 h-10"
                        />
                    </div>
                </div>

                <div class="flex flex-wrap gap-2">
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

                <p
                    v-if="errorMessage"
                    role="alert"
                    class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                    {{ errorMessage }}
                </p>

                <UiButton type="submit" size="sm" :loading="changePasswordMutation.isPending.value">
                    Guardar nueva contraseña
                </UiButton>
            </form>

            <aside
                class="border-t border-outline-variant bg-surface-container-low p-5 lg:border-l lg:border-t-0"
            >
                <p class="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    Recomendación
                </p>
                <p class="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    Usa una contraseña única que no hayas utilizado en otros servicios.
                </p>
            </aside>
        </section>
    </UiCard>
</template>
