<script setup lang="ts">
import SessionExpiryModal from '~/presentation/auth/components/SessionExpiryModal.vue'
import DashboardNavbar from '~/presentation/shared/components/DashboardNavbar.vue'

const route = useRoute()
const fixedViewport = computed(() => route.meta.fixedViewport === true)
</script>

<template>
    <div
        class="flex flex-col bg-surface-container-lowest text-on-surface"
        :class="fixedViewport ? 'h-dvh overflow-hidden' : 'min-h-screen'"
    >
        <DashboardNavbar />
        <SessionExpiryModal />

        <div class="flex flex-1 flex-col" :class="fixedViewport ? 'min-h-0' : ''">
            <slot />
        </div>

        <footer class="flex-none border-t border-outline-variant bg-surface-container-lowest">
            <div
                class="mx-auto flex max-w-system flex-col items-center justify-between px-6 md:flex-row lg:px-10"
                :class="fixedViewport ? 'gap-2 py-3' : 'gap-4 py-8'"
            >
                <span class="font-display text-2xl font-semibold text-primary">Sistema</span>
                <p class="text-xs font-semibold uppercase text-on-surface-variant">
                    © 2024 Sistema. Minimalismo Sagrado.
                </p>
                <div class="flex gap-6">
                    <NuxtLink
                        to="#"
                        class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
                    >
                        Soporte
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
                    >
                        Privacidad
                    </NuxtLink>
                    <NuxtLink
                        to="#"
                        class="text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface"
                    >
                        Términos
                    </NuxtLink>
                </div>
            </div>
        </footer>
    </div>
</template>
