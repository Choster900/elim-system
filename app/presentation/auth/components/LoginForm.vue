<script setup lang="ts">
import type { HttpClientError } from '~/presentation/shared/interfaces/http/http-client-error.interface'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import { useLoginMutation } from '../composables/useLoginMutation'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'

defineOptions({ name: 'AuthLoginForm' })

const form = reactive({
    email: '',
    password: '',
})

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
    <form class="flex flex-col gap-6" novalidate @submit.prevent="onSubmit">
        <div class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-2xl font-bold">Login to your account</h1>
            <p class="text-sm text-balance text-muted-foreground">
                Enter your email below to login to your account
            </p>
        </div>

        <div class="grid gap-6">
            <div class="grid gap-2">
                <UiLabel for="email">Email</UiLabel>
                <UiInput
                    id="email"
                    v-model="form.email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    autocomplete="email"
                />
            </div>

            <div class="grid gap-2">
                <div class="flex items-center">
                    <UiLabel for="password">Password</UiLabel>
                    <a href="#" class="ml-auto text-sm underline-offset-4 hover:underline">
                        Forgot your password?
                    </a>
                </div>
                <UiInput
                    id="password"
                    v-model="form.password"
                    type="password"
                    required
                    autocomplete="current-password"
                />
            </div>

            <UiButton type="submit" class="w-full" :loading="isLoading">
                Login
            </UiButton>
        </div>

        <div class="relative text-center text-sm">
            <span class="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
            </span>
            <div class="absolute inset-0 top-1/2 -z-0">
                <UiSeparator decorative />
            </div>
        </div>

        <div class="grid gap-4">
            <UiButton variant="outline" type="button" class="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                        fill="currentColor"
                    />
                </svg>
                Login with GitHub
            </UiButton>
            <p class="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?
                <a href="#" class="underline underline-offset-4"> Sign up </a>
            </p>
        </div>
    </form>
</template>
