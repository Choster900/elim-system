<script setup lang="ts">
import { Inbox, ListChecks } from '@lucide/vue'
import { RECEIVED_ENVELOPES_PATH, SUPPORT_COMMITTEE_HOME } from '../utils/reception-format.util'

defineProps<{
    active: 'pending' | 'received'
    pendingCount?: number | null
}>()

const tabClass =
    'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors'
</script>

<template>
    <nav class="flex gap-6 border-b border-outline-variant" aria-label="Secciones del comité">
        <NuxtLink
            :to="SUPPORT_COMMITTEE_HOME"
            :class="[
                tabClass,
                active === 'pending'
                    ? 'border-primary text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface',
            ]"
            :aria-current="active === 'pending' ? 'page' : undefined"
        >
            <Inbox class="size-4" />
            Por recibir
            <span
                v-if="pendingCount !== null && pendingCount !== undefined"
                class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary-foreground"
            >
                {{ pendingCount }}
            </span>
        </NuxtLink>
        <NuxtLink
            :to="RECEIVED_ENVELOPES_PATH"
            :class="[
                tabClass,
                active === 'received'
                    ? 'border-primary text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface',
            ]"
            :aria-current="active === 'received' ? 'page' : undefined"
        >
            <ListChecks class="size-4" />
            Recibidos
        </NuxtLink>
    </nav>
</template>
