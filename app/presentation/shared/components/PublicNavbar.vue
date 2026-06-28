<script setup lang="ts">
import { ChevronDown, Menu, X } from '@lucide/vue'
import AppBrand from './AppBrand.vue'

type NavGroup = {
    label: string
    href?: string
    active?: boolean
    items?: Array<{ label: string; href: string }>
}

const isOpen = ref(false)

const navGroups: NavGroup[] = [
    { label: 'Inicio', href: '/', active: true },
    {
        label: 'Ministerios',
        items: [
            { label: 'Jóvenes', href: '#ministerios' },
            { label: 'Adultos', href: '#ministerios' },
            { label: 'Música', href: '#ministerios' },
            { label: 'Misiones', href: '#ministerios' },
        ],
    },
    {
        label: 'Eventos',
        items: [
            { label: 'Calendario', href: '#ministerios' },
            { label: 'Inscripciones', href: '#boletin' },
            { label: 'Galería', href: '#vision' },
        ],
    },
    { label: 'Contacto', href: '#contacto' },
]

function closeMenu() {
    isOpen.value = false
}

function goToNewsletter() {
    if (import.meta.client && window.location.pathname === '/') {
        document.getElementById('boletin')?.scrollIntoView({ behavior: 'smooth' })
        return
    }

    navigateTo('/#boletin')
}
</script>

<template>
    <nav class="system-nav-blur fixed inset-x-0 top-0 z-50 border-b border-outline-variant">
        <div class="mx-auto flex max-w-system items-center justify-between px-6 py-5 lg:px-10">
            <AppBrand />

            <div class="hidden items-center gap-8 md:flex">
                <div v-for="group in navGroups" :key="group.label" class="relative group">
                    <NuxtLink
                        v-if="group.href"
                        :to="group.href"
                        :class="[
                            'text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:text-primary',
                            group.active ? 'border-b-2 border-primary pb-1 text-primary' : '',
                        ]"
                    >
                        {{ group.label }}
                    </NuxtLink>

                    <button
                        v-else
                        type="button"
                        class="flex items-center gap-1 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:text-primary"
                    >
                        {{ group.label }}
                        <ChevronDown class="size-4" />
                    </button>

                    <div
                        v-if="group.items"
                        class="invisible absolute left-0 top-full mt-3 w-48 border border-outline-variant bg-surface-container py-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100"
                    >
                        <NuxtLink
                            v-for="item in group.items"
                            :key="item.label"
                            :to="item.href"
                            class="block px-4 py-2 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                        >
                            {{ item.label }}
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <div class="hidden items-center gap-3 md:flex">
                <UiButton
                    variant="ghost"
                    type="button"
                    class="text-xs uppercase text-on-surface-variant hover:bg-transparent hover:text-primary"
                    @click="navigateTo('/login')"
                >
                    Iniciar Sesión
                </UiButton>
                <UiButton
                    type="button"
                    class="h-10 rounded px-6 text-xs uppercase"
                    @click="goToNewsletter"
                >
                    Unirse
                </UiButton>
            </div>

            <UiButton
                variant="ghost"
                size="icon"
                type="button"
                class="md:hidden"
                :aria-label="isOpen ? 'Cerrar navegación' : 'Abrir navegación'"
                @click="isOpen = !isOpen"
            >
                <X v-if="isOpen" class="size-5" />
                <Menu v-else class="size-5" />
            </UiButton>
        </div>

        <div v-if="isOpen" class="border-t border-outline-variant bg-surface-container-low px-6 py-5 md:hidden">
            <div class="flex flex-col gap-4">
                <template v-for="group in navGroups" :key="group.label">
                    <NuxtLink
                        v-if="group.href"
                        :to="group.href"
                        class="text-sm font-semibold uppercase text-on-surface-variant"
                        @click="closeMenu"
                    >
                        {{ group.label }}
                    </NuxtLink>
                    <div v-else class="space-y-3">
                        <p class="text-sm font-semibold uppercase text-primary">{{ group.label }}</p>
                        <NuxtLink
                            v-for="item in group.items"
                            :key="item.label"
                            :to="item.href"
                            class="block pl-4 text-sm text-on-surface-variant"
                            @click="closeMenu"
                        >
                            {{ item.label }}
                        </NuxtLink>
                    </div>
                </template>
                <UiButton type="button" class="mt-2 w-full rounded" @click="navigateTo('/login')">
                    Iniciar Sesión
                </UiButton>
            </div>
        </div>
    </nav>
</template>
