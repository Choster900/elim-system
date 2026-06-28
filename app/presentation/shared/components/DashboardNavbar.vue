<script setup lang="ts">
import { Bell, ChevronDown, ChevronRight, Menu, Settings, X } from '@lucide/vue'
import adminAvatarImage from '~/assets/images/system/admin-avatar.png'
import AppBrand from './AppBrand.vue'

type DashboardMenuItem = {
    label: string
    href?: string
    children?: DashboardMenuItem[]
}

const isOpen = ref(false)

const navItems: DashboardMenuItem[] = [
    { label: 'Panel', href: '/dashboard' },
    {
        label: 'Comunidad',
        children: [
            { label: 'Miembros', href: '#' },
            { label: 'Grupos Pequeños', href: '#' },
            { label: 'Voluntarios', href: '#' },
        ],
    },
    {
        label: 'Ministerios',
        children: [
            { label: 'Liderazgo', href: '#' },
            {
                label: 'Adultos',
                children: [
                    { label: 'Matrimonios', href: '#' },
                    { label: 'Hombres', href: '#' },
                    { label: 'Mujeres', href: '#' },
                ],
            },
            { label: 'Recursos', href: '#' },
            { label: 'Reportes', href: '#' },
        ],
    },
    { label: 'Eventos', href: '#' },
    {
        label: 'Finanzas',
        children: [
            { label: 'Ofrendas', href: '#' },
            { label: 'Gastos', href: '#' },
            {
                label: 'Reportes',
                children: [
                    { label: 'Mensual', href: '#' },
                    { label: 'Trimestral', href: '#' },
                    { label: 'Anual', href: '#' },
                ],
            },
            { label: 'Presupuesto', href: '#' },
        ],
    },
]
</script>

<template>
    <nav class="fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-surface">
        <div class="mx-auto flex max-w-system items-center justify-between px-6 py-4 lg:px-10">
            <div class="flex items-center gap-10">
                <AppBrand to="/dashboard" />

                <div class="hidden items-center gap-7 lg:flex">
                    <div v-for="item in navItems" :key="item.label" class="relative group">
                        <NuxtLink
                            v-if="item.href"
                            :to="item.href"
                            :class="[
                                'text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface',
                                item.label === 'Panel' ? 'border-b-2 border-primary pb-1 text-primary' : '',
                            ]"
                        >
                            {{ item.label }}
                        </NuxtLink>

                        <button
                            v-else
                            type="button"
                            class="flex items-center gap-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
                        >
                            {{ item.label }}
                            <ChevronDown class="size-4" />
                        </button>

                        <div
                            v-if="item.children"
                            class="invisible absolute left-0 top-full mt-3 w-52 border border-outline-variant bg-surface-container py-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100"
                        >
                            <template v-for="child in item.children" :key="child.label">
                                <NuxtLink
                                    v-if="child.href"
                                    :to="child.href"
                                    class="block px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                                >
                                    {{ child.label }}
                                </NuxtLink>
                                <div v-else class="relative group/sub">
                                    <button
                                        type="button"
                                        class="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                                    >
                                        {{ child.label }}
                                        <ChevronRight class="size-4" />
                                    </button>
                                    <div
                                        class="invisible absolute left-full top-0 w-52 border border-outline-variant bg-surface-container py-2 opacity-0 transition-all duration-200 group-hover/sub:visible group-hover/sub:opacity-100"
                                    >
                                        <NuxtLink
                                            v-for="nested in child.children"
                                            :key="nested.label"
                                            :to="nested.href ?? '#'"
                                            class="block px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                                        >
                                            {{ nested.label }}
                                        </NuxtLink>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hidden items-center gap-4 sm:flex">
                <UiButton variant="ghost" size="icon" type="button" aria-label="Notificaciones">
                    <Bell class="size-5" />
                </UiButton>
                <UiButton variant="ghost" size="icon" type="button" aria-label="Configuración">
                    <Settings class="size-5" />
                </UiButton>
                <div class="size-10 overflow-hidden rounded-full border border-outline-variant">
                    <img
                        :src="adminAvatarImage"
                        alt="Avatar del administrador"
                        class="size-full object-cover"
                    />
                </div>
            </div>

            <UiButton
                variant="ghost"
                size="icon"
                type="button"
                class="lg:hidden"
                :aria-label="isOpen ? 'Cerrar menú' : 'Abrir menú'"
                @click="isOpen = !isOpen"
            >
                <X v-if="isOpen" class="size-5" />
                <Menu v-else class="size-5" />
            </UiButton>
        </div>

        <div v-if="isOpen" class="border-t border-outline-variant bg-surface-container-low px-6 py-5 lg:hidden">
            <div class="grid gap-4">
                <template v-for="item in navItems" :key="item.label">
                    <NuxtLink
                        v-if="item.href"
                        :to="item.href"
                        class="text-sm font-semibold uppercase text-primary"
                        @click="isOpen = false"
                    >
                        {{ item.label }}
                    </NuxtLink>
                    <div v-else class="space-y-2">
                        <p class="text-sm font-semibold uppercase text-on-surface">{{ item.label }}</p>
                        <div class="grid gap-2 pl-4">
                            <NuxtLink
                                v-for="child in item.children"
                                :key="child.label"
                                :to="child.href ?? '#'"
                                class="text-sm text-on-surface-variant"
                                @click="isOpen = false"
                            >
                                {{ child.label }}
                            </NuxtLink>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </nav>
</template>
