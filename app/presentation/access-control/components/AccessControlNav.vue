<script setup lang="ts">
import { KeyRound, ShieldCheck, UsersRound } from '@lucide/vue'
import type { AccessControlSection } from '../interfaces/access-control.interface'

const props = withDefaults(
    defineProps<{
        modelValue: AccessControlSection
        allowedSections?: AccessControlSection[]
    }>(),
    { allowedSections: () => ['users', 'roles', 'permissions'] },
)

const emit = defineEmits<{
    'update:modelValue': [value: AccessControlSection]
}>()

const items = [
    {
        label: 'Usuarios',
        description: 'Cuentas de acceso',
        value: 'users' as const,
        icon: UsersRound,
    },
    {
        label: 'Roles',
        description: 'Perfiles de acceso',
        value: 'roles' as const,
        icon: ShieldCheck,
    },
    {
        label: 'Permisos',
        description: 'Acciones autorizadas',
        value: 'permissions' as const,
        icon: KeyRound,
    },
]

const visibleItems = computed(() =>
    items.filter((item) => props.allowedSections.includes(item.value)),
)
</script>

<template>
    <nav
        class="grid overflow-hidden rounded-lg border border-outline-variant bg-surface-container sm:grid-cols-3"
        aria-label="Administración de acceso"
    >
        <button
            v-for="item in visibleItems"
            :key="item.value"
            type="button"
            class="flex items-center gap-3 border-b border-outline-variant px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-container-high sm:border-b-0 sm:border-r sm:last:border-r-0"
            :class="
                modelValue === item.value ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
            "
            :aria-current="modelValue === item.value ? 'page' : undefined"
            @click="emit('update:modelValue', item.value)"
        >
            <component :is="item.icon" class="size-5 shrink-0" />
            <span>
                <span class="block text-sm font-semibold">{{ item.label }}</span>
                <span class="block text-[11px] opacity-75">{{ item.description }}</span>
            </span>
        </button>
    </nav>
</template>
