<script setup lang="ts">
import { ArrowLeft, Church, Home } from '@lucide/vue'
import type { NuxtError } from '#app'
import AppBrand from '~/presentation/shared/components/AppBrand.vue'

const props = defineProps<{
    error: NuxtError
}>()

const isNotFound = computed(() => props.error?.statusCode === 404)
const statusCode = computed(() => props.error?.statusCode ?? 500)

const heading = computed(() => (isNotFound.value ? 'Página no encontrada' : 'Algo no salió bien'))
const description = computed(() =>
    isNotFound.value
        ? 'El sendero que buscas no figura en nuestro mapa. Tal vez se mudó, o quizá nunca existió.'
        : 'Ocurrió un imprevisto al cargar este espacio. Respira, intenta de nuevo en un momento.',
)

useHead({
    title: () => `${statusCode.value} · ${heading.value}`,
})

function goHome() {
    clearError({ redirect: '/' })
}

function goBack() {
    if (import.meta.client && window.history.length > 1) {
        window.history.back()
        return
    }
    clearError({ redirect: '/' })
}
</script>

<template>
    <div class="relative flex min-h-screen flex-col overflow-hidden bg-background text-on-surface">
        <header class="relative z-20 mx-auto flex w-full max-w-system items-center justify-between px-6 py-6 lg:px-10">
            <AppBrand />
            <NuxtLink
                to="/"
                class="flex items-center gap-2 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
                <ArrowLeft class="size-4" />
                Volver al inicio
            </NuxtLink>
        </header>

        <main class="relative flex flex-1 items-center justify-center px-6 py-12">
            <div aria-hidden="true" class="pointer-events-none absolute inset-0">
                <div class="absolute inset-x-0 top-1/3 mx-auto h-[480px] max-w-[680px] rounded-full bg-primary/5 blur-3xl" />
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            </div>

            <section class="relative z-10 w-full max-w-[640px] text-center">
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                    Error · {{ statusCode }}
                </p>

                <h1 class="mt-6 font-display text-[clamp(5rem,18vw,9rem)] font-semibold leading-none text-primary">
                    {{ statusCode }}
                </h1>

                <div class="mt-6 flex items-center justify-center gap-4 text-primary/70">
                    <div class="h-px w-16 bg-outline-variant" />
                    <Church class="size-5" />
                    <div class="h-px w-16 bg-outline-variant" />
                </div>

                <h2 class="mt-8 font-display text-3xl font-semibold text-on-surface md:text-4xl">
                    {{ heading }}
                </h2>

                <p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-on-surface-variant">
                    {{ description }}
                </p>

                <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <UiButton
                        type="button"
                        class="h-11 rounded px-8 text-xs uppercase tracking-wider"
                        @click="goHome"
                    >
                        <Home class="mr-2 size-4" />
                        Ir al inicio
                    </UiButton>
                    <UiButton
                        variant="outline"
                        type="button"
                        class="h-11 rounded border-primary px-8 text-xs uppercase tracking-wider text-primary"
                        @click="goBack"
                    >
                        <ArrowLeft class="mr-2 size-4" />
                        Volver atrás
                    </UiButton>
                </div>

                <p v-if="!isNotFound && error?.message" class="mt-8 font-mono text-[11px] text-on-surface-variant/70">
                    {{ error.message }}
                </p>
            </section>
        </main>

        <footer class="relative z-10 px-6 py-4 text-center">
            <p class="text-xs font-medium uppercase text-on-surface-variant">
                © 2024 Sistema Moderno. Un espacio de paz y conexión.
            </p>
        </footer>
    </div>
</template>
