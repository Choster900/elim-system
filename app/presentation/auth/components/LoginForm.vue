<script setup lang="ts">
import { Eye, EyeOff, Lock, Mail } from '@lucide/vue'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useLoginMutation } from '../composables/useLoginMutation'

defineOptions({ name: 'AuthLoginForm' })

const form = reactive({
    email: '',
    password: '',
})

const showPassword = ref(false)
const toast = useAppToast()
const loginMutation = useLoginMutation()

const isLoading = computed(() => loginMutation.isPending.value)

function resolveErrorMessage(error: unknown) {
    const fallbackMessage = 'No fue posible iniciar sesión'
    const httpError = error as HttpClientError | undefined
    const apiResponse = httpError?.details as ApiResponse<null> | undefined

    return apiResponse?.message ?? httpError?.message ?? fallbackMessage
}

async function onSubmit() {
    try {
        await loginMutation.mutateAsync({
            email: form.email,
            password: form.password,
        })
        toast.success('Inicio de sesión exitoso')
        await navigateTo('/dashboard')
    } catch (error: unknown) {
        toast.error(resolveErrorMessage(error))
    }
}
</script>

<template>
    <form class="space-y-6" novalidate @submit.prevent="onSubmit">
        <div class="mb-10 text-center">
            <h1 class="font-display text-4xl font-semibold text-on-surface">Bienvenido</h1>
            <p class="mt-2 text-on-surface-variant">Ingresa a tu comunidad espiritual</p>
        </div>

        <div class="space-y-2">
            <UiLabel for="email" class="text-xs uppercase text-on-surface-variant">
                Correo electrónico
            </UiLabel>
            <div class="relative">
                <Mail class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                <UiInput
                    id="email"
                    v-model="form.email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    required
                    autocomplete="email"
                    class="h-12 rounded-none border-x-0 border-t-0 bg-transparent pl-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
        </div>

        <div class="space-y-2">
            <div class="flex items-center justify-between gap-4">
                <UiLabel for="password" class="text-xs uppercase text-on-surface-variant">
                    Contraseña
                </UiLabel>
                <NuxtLink to="#" class="text-xs font-semibold uppercase text-primary underline-offset-4 hover:underline">
                    ¿Olvidaste tu contraseña?
                </NuxtLink>
            </div>
            <div class="relative">
                <Lock class="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant" />
                <UiInput
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    class="h-12 rounded-none border-x-0 border-t-0 bg-transparent px-8 text-on-surface placeholder:text-[#d1c5b4]/40 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
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
        </div>

        <div class="pt-4">
            <UiButton type="submit" class="h-12 w-full rounded text-xs uppercase" :loading="isLoading">
                Iniciar sesión
            </UiButton>
        </div>

        <div class="border-t border-outline-variant pt-8 text-center">
            <p class="mb-4 text-sm text-on-surface-variant">
                ¿Aún no eres parte de nuestra comunidad?
            </p>
            <UiButton
                variant="outline"
                type="button"
                class="h-11 rounded border-primary px-8 text-xs uppercase text-primary"
                @click="navigateTo('/register')"
            >
                Crear cuenta
            </UiButton>
        </div>
    </form>
</template>
