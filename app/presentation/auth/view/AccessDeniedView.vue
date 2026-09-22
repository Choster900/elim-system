<script setup lang="ts">
import { ArrowRight, ShieldCheck } from '@lucide/vue'
import { useAuthStore } from '../stores/auth.store'
import { resolveAccessibleHomePath } from '../utils/accessible-home-path.util'

defineOptions({ name: 'AccessDeniedView' })

useHead({ title: 'Redirigiendo · Sistema' })

const authStore = useAuthStore()
const destinationPath = computed(() => resolveAccessibleHomePath(authStore.permissionCodes))

onMounted(() =>
    window.setTimeout(() => navigateTo(destinationPath.value, { replace: true }), 1_800),
)
</script>

<template>
    <main class="mx-auto flex min-h-[72vh] max-w-2xl items-center px-6 pb-20 pt-28">
        <UiCard class="w-full p-8 text-center sm:p-12">
            <div
                class="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <ShieldCheck class="size-8" />
            </div>
            <p class="mt-7 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                Navegación protegida
            </p>
            <h1 class="mt-3 font-display text-4xl font-semibold text-on-surface">
                Te llevamos a tu área de trabajo
            </h1>
            <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-on-surface-variant">
                Para proteger la información de la comunidad, esta sección no está disponible para
                tu cuenta. Te redirigiremos a una sección que puedes consultar.
            </p>
            <div class="mt-8 flex justify-center">
                <UiButton type="button" @click="navigateTo(destinationPath, { replace: true })">
                    Continuar <ArrowRight class="size-4" />
                </UiButton>
            </div>
        </UiCard>
    </main>
</template>
