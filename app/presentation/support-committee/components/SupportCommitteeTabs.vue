<script setup lang="ts">
import { Church, HandCoins, Inbox, ListChecks } from '@lucide/vue'
import type { Component } from 'vue'
import { usePendingCountQuery } from '../composables/useReceptionQueries'
import {
    GENERAL_SERVICES_PATH,
    RECEIVED_ENVELOPES_PATH,
    SUPPORT_COMMITTEE_HOME,
    TITHES_PATH,
} from '../utils/reception-format.util'

type SupportCommitteeTab = 'pending' | 'generals' | 'received' | 'tithes'

defineProps<{
    active: SupportCommitteeTab
}>()

const leaderCount = usePendingCountQuery('lideres')
const generalCount = usePendingCountQuery('generales')

const tabs = computed<
    { key: SupportCommitteeTab; label: string; to: string; icon: Component; count: number | null }[]
>(() => [
    {
        key: 'pending',
        label: 'Por recibir',
        to: SUPPORT_COMMITTEE_HOME,
        icon: Inbox,
        count: leaderCount.value,
    },
    {
        key: 'generals',
        label: 'Cultos generales',
        to: GENERAL_SERVICES_PATH,
        icon: Church,
        count: generalCount.value,
    },
    {
        key: 'received',
        label: 'Recibidos',
        to: RECEIVED_ENVELOPES_PATH,
        icon: ListChecks,
        count: null,
    },
    { key: 'tithes', label: 'Diezmos', to: TITHES_PATH, icon: HandCoins, count: null },
])

const tabClass =
    'inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors'

function stateClass(isActive: boolean) {
    return isActive
        ? 'border-primary text-on-surface'
        : 'border-transparent text-on-surface-variant hover:text-on-surface'
}
</script>

<template>
    <nav
        class="flex gap-4 overflow-x-auto border-b border-outline-variant sm:gap-6"
        aria-label="Secciones del comité"
    >
        <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="tab.to"
            :class="[tabClass, stateClass(active === tab.key)]"
            :aria-current="active === tab.key ? 'page' : undefined"
        >
            <component :is="tab.icon" class="hidden size-4 sm:block" />
            {{ tab.label }}
            <span
                v-if="tab.count !== null && tab.count > 0"
                class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary-foreground"
            >
                {{ tab.count }}
            </span>
        </NuxtLink>
    </nav>
</template>
