<template>
    <main class="flex min-h-screen items-center justify-center px-4">
        <section class="space-y-4 text-center">
            <div class="flex justify-center">
                <button
                    type="button"
                    class="rounded-full border border-[rgb(var(--app-fg))] px-4 py-2 text-sm font-medium text-[rgb(var(--app-fg))] transition-opacity hover:opacity-80"
                    @click="toggleMode"
                >
                    {{ mode === 'dark' ? 'Modo claro' : 'Modo oscuro' }}
                </button>
            </div>

            <h1 class="text-3xl font-semibold tracking-normal text-[rgb(var(--app-fg))]">
                Hola mundo
            </h1>

            <p v-if="isPending" class="text-sm text-[rgb(var(--app-fg))] opacity-75">
                Verificando API...
            </p>
            <p v-else-if="isError" class="text-sm text-red-500">API no disponible</p>
            <p v-else class="text-sm text-emerald-500">
                API {{ data?.status }} - {{ data?.service }} - {{ data?.timestamp }}
            </p>
        </section>
    </main>
</template>

<script setup lang="ts">
import { useHealthcheckQuery } from '~/presentation/landing/composables/useHealthcheckQuery'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { useThemeMode } from '~/presentation/shared/composables/useThemeMode'

defineOptions({
    name: 'HomePage',
})

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
