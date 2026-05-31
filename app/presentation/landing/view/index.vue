<template>
    <main class="flex min-h-screen items-center justify-center px-4">
        <section class="space-y-4 text-center">
            <div class="flex justify-center">
                <button
                    type="button"
                    class="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-80"
                    @click="toggleMode"
                >
                    {{ mode === 'dark' ? 'Modo claro' : 'Modo oscuro' }}
                </button>
            </div>

            <h1 class="text-3xl font-semibold tracking-tight text-foreground">
                Hola mundo
            </h1>

            <p v-if="isPending" class="text-sm text-muted-foreground">Verificando API...</p>
            <p v-else-if="isError" class="text-sm text-destructive">API no disponible</p>
            <p v-else class="text-sm text-foreground/70">
                API {{ data?.status }} — {{ data?.service }} — {{ data?.timestamp }}
            </p>

            <div class="pt-2">
                <a
                    href="/login"
                    class="text-sm text-primary underline underline-offset-4 hover:opacity-80"
                >
                    Ir a Login →
                </a>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { useHealthcheckQuery } from '~/presentation/landing/composables/useHealthcheckQuery'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useThemeMode } from '~/presentation/shared/composables/useThemeMode'

defineOptions({ name: 'HomePage' })

const { data, isPending, isError, refetch } = useHealthcheckQuery({ enabled: false })
const { mode, toggleMode } = useThemeMode()
const toast = useAppToast()

onMounted(() => {
    toast.promise(refetch({ throwOnError: true }), {
        loading: 'Procesando...',
        success: () => 'Completado',
        error: () => 'Falló',
    })
})
</script>
