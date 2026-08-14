<script setup lang="ts">
import { Eye, EyeOff, Lock, Mail } from '@lucide/vue'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatValidationMessage } from '~/utils/string/text-format.util'
import { useLoginMutation } from '../composables/useLoginMutation'
import { useAuthStore } from '../stores/auth.store'

defineOptions({ name: 'AuthLoginForm' })

type FieldKey = 'email' | 'password'

const form = reactive<Record<FieldKey, string>>({
    email: 'admin@local.test',
    password: 'Admin12345!',
})

const fieldErrors = reactive<Record<FieldKey, string | null>>({
    email: null,
    password: null,
})

const formError = ref<string | null>(null)

const showPassword = ref(false)
const toast = useAppToast()
const loginMutation = useLoginMutation()
const authStore = useAuthStore()
const route = useRoute()

const isLoading = computed(() => loginMutation.isPending.value)

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

async function onSubmit() {
    fieldErrors.email = null
    fieldErrors.password = null
    formError.value = null

    try {
        const result = await loginMutation.mutateAsync({
            email: form.email,
            password: form.password,
        })
        authStore.setUser(result.user)
        toast.success('Inicio de sesión exitoso')
        const requestedRedirect =
            typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
        const redirectPath =
            requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
                ? requestedRedirect
                : '/dashboard'
        await navigateTo(redirectPath)
    } catch (error: unknown) {
        const httpError = error as HttpClientError | undefined
        const apiResponse = httpError?.details as ApiResponse<null> | undefined
        const errorCode = apiResponse?.error?.code

        if (errorCode === 'VALIDATION_ERROR' && applyValidationErrors(apiResponse)) {
            return
        }

        if (apiResponse?.error) {
            formError.value =
                apiResponse.error.details ??
                apiResponse.message ??
                resolveHttpErrorMessage(error, 'No fue posible iniciar sesión')
            return
        }

        toast.error(resolveHttpErrorMessage(error, 'No fue posible iniciar sesión'))
    }
}
</script>

<template>
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div class="mb-5 text-center">
            <h1 class="font-display text-3xl font-semibold text-on-surface">Bienvenido</h1>
            <p class="mt-1 text-sm text-on-surface-variant">Ingresa a tu comunidad espiritual</p>
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
                    Contraseña
                </UiLabel>
                <NuxtLink
                    to="#"
                    class="text-xs font-semibold uppercase text-primary underline-offset-4 hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </NuxtLink>
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
            >
                Iniciar sesión
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
