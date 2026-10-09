<script setup lang="ts">
import { ArrowRight, Menu, X } from '@lucide/vue'
import { useAccessAction } from '~/presentation/auth/composables/useAccessAction'
import { landingNavLinks } from '~/presentation/landing/constants/landing.constants'
import AppBrand from './AppBrand.vue'

const isOpen = ref(false)
const accessAction = useAccessAction()

function closeMenu() {
    isOpen.value = false
}

if (import.meta.client) {
    const desktopQuery = window.matchMedia('(min-width: 900px)')
    const onDesktop = (event: MediaQueryListEvent) => {
        if (event.matches) closeMenu()
    }
    onMounted(() => desktopQuery.addEventListener('change', onDesktop))
    onBeforeUnmount(() => desktopQuery.removeEventListener('change', onDesktop))
}
</script>

<template>
    <header
        class="fixed inset-x-0 top-0 z-50 border-b border-[rgba(78,70,57,0.6)] bg-[rgba(18,20,20,0.78)] backdrop-blur-lg"
    >
        <nav
            aria-label="Principal"
            class="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-6 px-6"
        >
            <AppBrand />

            <div class="hidden items-center gap-8 min-[900px]:flex">
                <NuxtLink
                    v-for="link in landingNavLinks"
                    :key="link.href"
                    :to="link.href"
                    class="py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant transition-colors hover:text-primary"
                >
                    {{ link.label }}
                </NuxtLink>
            </div>

            <div class="flex items-center gap-3">
                <NuxtLink
                    :to="accessAction.to"
                    class="landing-btn-gold hidden h-11 items-center gap-2 rounded-md bg-primary px-[22px] text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground min-[900px]:inline-flex"
                >
                    {{ accessAction.label }}
                    <ArrowRight v-if="accessAction.isAuthenticated" class="size-3.5" />
                </NuxtLink>
                <button
                    type="button"
                    class="inline-flex size-11 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition-colors hover:border-primary hover:text-primary min-[900px]:hidden"
                    :aria-label="isOpen ? 'Cerrar menú' : 'Abrir menú'"
                    :aria-expanded="isOpen"
                    aria-controls="public-mobile-menu"
                    @click="isOpen = !isOpen"
                >
                    <X v-if="isOpen" class="size-5" />
                    <Menu v-else class="size-5" />
                </button>
            </div>
        </nav>

        <div
            v-if="isOpen"
            id="public-mobile-menu"
            class="flex flex-col border-t border-outline-variant bg-surface-container-low px-6 pb-6 pt-3 min-[900px]:hidden"
        >
            <NuxtLink
                v-for="link in landingNavLinks"
                :key="link.href"
                :to="link.href"
                class="border-b border-[rgba(78,70,57,0.5)] py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant transition-colors last-of-type:border-b-0 hover:text-primary"
                @click="closeMenu"
            >
                {{ link.label }}
            </NuxtLink>
            <NuxtLink
                :to="accessAction.to"
                class="landing-btn-gold mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground"
                @click="closeMenu"
            >
                {{ accessAction.label }}
                <ArrowRight v-if="accessAction.isAuthenticated" class="size-4" />
            </NuxtLink>
        </div>
    </header>
</template>
