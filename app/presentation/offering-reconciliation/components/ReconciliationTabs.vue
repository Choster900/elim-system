<script setup lang="ts">
import { LayoutDashboard, ListChecks, Users } from '@lucide/vue'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import {
    RECONCILIATION_ENVELOPES,
    RECONCILIATION_HOME,
    RECONCILIATION_LEADERS,
} from '../utils/reconciliation-format.util'

defineProps<{
    active: 'summary' | 'envelopes' | 'leaders'
}>()

const { linkTo } = useReconciliationFilters()

const tabs = [
    { key: 'summary', label: 'Resumen', path: RECONCILIATION_HOME, icon: LayoutDashboard },
    { key: 'envelopes', label: 'Sobres', path: RECONCILIATION_ENVELOPES, icon: ListChecks },
    { key: 'leaders', label: 'Por líder', path: RECONCILIATION_LEADERS, icon: Users },
] as const
</script>

<template>
    <nav class="flex gap-6 border-b border-outline-variant" aria-label="Secciones de conciliación">
        <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="linkTo(tab.path)"
            class="inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors"
            :class="
                active === tab.key
                    ? 'border-primary text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
            "
            :aria-current="active === tab.key ? 'page' : undefined"
        >
            <component :is="tab.icon" class="size-4" />
            {{ tab.label }}
        </NuxtLink>
    </nav>
</template>
