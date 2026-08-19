<script setup lang="ts">
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Settings, X } from '@lucide/vue'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'radix-vue'
import { useLogoutMutation } from '~/presentation/auth/composables/useLogoutMutation'
import { routePermissionCodes } from '~/presentation/auth/constants/permission.constants'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import AppBrand from './AppBrand.vue'

type DashboardMenuItem = {
    label: string
    href?: string
    children?: DashboardMenuItem[]
    requiredPermission?: string
    requiredAnyPermissions?: string[]
}

const isOpen = ref(false)
const toast = useAppToast()
const logoutMutation = useLogoutMutation()
const authStore = useAuthStore()

const isLoggingOut = computed(() => logoutMutation.isPending.value)
const userInitials = computed(() => authStore.initials)
const userDisplayName = computed(() => authStore.displayName)
const userEmail = computed(() => authStore.user?.email ?? '')

async function handleLogout() {
    try {
        await logoutMutation.mutateAsync()
        toast.success('Sesión cerrada')
    } catch {
        toast.error('No fue posible cerrar la sesión, pero serás redirigido')
    } finally {
        isOpen.value = false
        await navigateTo('/login')
    }
}

const navItems: DashboardMenuItem[] = [
    {
        label: 'Panel',
        href: '/dashboard',
        requiredPermission: routePermissionCodes.dashboard,
    },
    {
        label: 'Comunidad',
        children: [
            {
                label: 'Miembros',
                href: '/comunidad/miembros',
                requiredPermission: routePermissionCodes.membersView,
            },
            {
                label: 'Usuarios y accesos',
                href: '/comunidad/usuarios',
                requiredAnyPermissions: [
                    routePermissionCodes.usersView,
                    routePermissionCodes.rolesView,
                    routePermissionCodes.permissionsView,
                ],
            },
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
            {
                label: 'Pendientes de registro',
                href: '/finanzas/ofrendas',
                requiredPermission: routePermissionCodes.financeView,
            },
            {
                label: 'Mis reuniones',
                href: '/finanzas/mis-reuniones',
                requiredPermission: routePermissionCodes.financeRecord,
            },
            {
                label: 'Historial de ofrendas',
                href: '/finanzas/ofrendas/historial',
                requiredPermission: routePermissionCodes.financeView,
            },
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
    {
        label: 'Catálogos',
        children: [
            {
                label: 'Reuniones',
                href: '/catalogos/reuniones',
                requiredPermission: routePermissionCodes.meetingsView,
            },
            {
                label: 'Distritos',
                href: '/catalogos/distritos',
                requiredPermission: routePermissionCodes.territoriesView,
            },
        ],
    },
]

function resolveAccessManagementHref() {
    if (authStore.hasPermission(routePermissionCodes.usersView)) return '/comunidad/usuarios'
    if (authStore.hasPermission(routePermissionCodes.rolesView)) {
        return '/comunidad/usuarios?section=roles'
    }
    return '/comunidad/usuarios?section=permissions'
}

function filterMenuItem(item: DashboardMenuItem): DashboardMenuItem | null {
    if (item.requiredPermission && !authStore.hasPermission(item.requiredPermission)) return null
    if (
        item.requiredAnyPermissions &&
        !item.requiredAnyPermissions.some((permission) => authStore.hasPermission(permission))
    ) {
        return null
    }

    const children = item.children
        ?.map(filterMenuItem)
        .filter((child): child is DashboardMenuItem => child !== null)

    if (item.children && !children?.length && !item.href) return null

    return {
        ...item,
        href: item.href === '/comunidad/usuarios' ? resolveAccessManagementHref() : item.href,
        children,
    }
}

const visibleNavItems = computed(() =>
    navItems.map(filterMenuItem).filter((item): item is DashboardMenuItem => item !== null),
)
</script>

<template>
    <nav class="fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-surface">
        <div class="mx-auto flex max-w-system items-center justify-between px-6 py-2.5 lg:px-10">
            <div class="flex items-center gap-10">
                <AppBrand to="/dashboard" />

                <div class="hidden items-center gap-7 lg:flex">
                    <div v-for="item in visibleNavItems" :key="item.label" class="relative group">
                        <NuxtLink
                            v-if="item.href"
                            :to="item.href"
                            :class="[
                                'text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface',
                                item.label === 'Panel'
                                    ? 'border-b-2 border-primary pb-1 text-primary'
                                    : '',
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

            <div class="hidden items-center gap-3 sm:flex">
                <UiButton variant="ghost" size="icon" type="button" aria-label="Notificaciones">
                    <Bell class="size-5" />
                </UiButton>

                <DropdownMenuRoot>
                    <DropdownMenuTrigger
                        class="flex size-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-sm font-semibold uppercase text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        :aria-label="`Menú de ${userDisplayName}`"
                    >
                        {{ userInitials }}
                    </DropdownMenuTrigger>

                    <DropdownMenuPortal>
                        <DropdownMenuContent
                            :side-offset="8"
                            align="end"
                            class="z-50 w-60 overflow-hidden border border-outline-variant bg-surface-container py-2 shadow-lg focus:outline-none"
                        >
                            <div class="border-b border-outline-variant px-4 py-3">
                                <p class="text-sm font-semibold text-on-surface">
                                    {{ userDisplayName }}
                                </p>
                                <p
                                    v-if="userEmail"
                                    class="mt-0.5 truncate text-xs text-on-surface-variant"
                                >
                                    {{ userEmail }}
                                </p>
                            </div>

                            <DropdownMenuItem
                                class="flex cursor-pointer items-center gap-3 px-4 py-3 text-xs font-semibold uppercase text-on-surface-variant outline-none transition-colors data-[highlighted]:bg-surface-container-high data-[highlighted]:text-primary"
                                @select="navigateTo('/settings')"
                            >
                                <Settings class="size-4" />
                                Configuración
                            </DropdownMenuItem>

                            <DropdownMenuSeparator class="my-1 h-px bg-outline-variant" />

                            <DropdownMenuItem
                                :disabled="isLoggingOut"
                                class="flex cursor-pointer items-center gap-3 px-4 py-3 text-xs font-semibold uppercase text-destructive outline-none transition-colors data-[highlighted]:bg-destructive/10 data-[disabled]:opacity-50"
                                @select="handleLogout"
                            >
                                <LogOut class="size-4" />
                                {{ isLoggingOut ? 'Cerrando…' : 'Cerrar sesión' }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
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

        <div
            v-if="isOpen"
            class="border-t border-outline-variant bg-surface-container-low px-6 py-5 lg:hidden"
        >
            <div class="grid gap-4">
                <div class="flex items-center gap-3 border-b border-outline-variant pb-4 sm:hidden">
                    <div
                        class="flex size-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-sm font-semibold uppercase text-on-surface"
                    >
                        {{ userInitials }}
                    </div>
                    <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-on-surface">
                            {{ userDisplayName }}
                        </p>
                        <p v-if="userEmail" class="truncate text-xs text-on-surface-variant">
                            {{ userEmail }}
                        </p>
                    </div>
                </div>

                <template v-for="item in visibleNavItems" :key="item.label">
                    <NuxtLink
                        v-if="item.href"
                        :to="item.href"
                        class="text-sm font-semibold uppercase text-primary"
                        @click="isOpen = false"
                    >
                        {{ item.label }}
                    </NuxtLink>
                    <div v-else class="space-y-2">
                        <p class="text-sm font-semibold uppercase text-on-surface">
                            {{ item.label }}
                        </p>
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

                <div class="mt-2 grid gap-3 border-t border-outline-variant pt-4 sm:hidden">
                    <NuxtLink
                        to="/settings"
                        class="flex items-center gap-2 text-sm font-semibold uppercase text-on-surface-variant"
                        @click="isOpen = false"
                    >
                        <Settings class="size-4" />
                        Configuración
                    </NuxtLink>
                    <button
                        type="button"
                        class="flex items-center gap-2 text-left text-sm font-semibold uppercase text-destructive disabled:opacity-60"
                        :disabled="isLoggingOut"
                        @click="handleLogout"
                    >
                        <LogOut class="size-4" />
                        {{ isLoggingOut ? 'Cerrando…' : 'Cerrar sesión' }}
                    </button>
                </div>
            </div>
        </div>
    </nav>
</template>
