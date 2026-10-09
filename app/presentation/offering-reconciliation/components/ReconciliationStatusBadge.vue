<script setup lang="ts">
import type { ReconciliationStatus } from '../interfaces/reconciliation.interface'
import { statusMeta } from '../utils/reconciliation-format.util'

defineProps<{
    status: ReconciliationStatus
}>()
</script>

<template>
    <span
        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold"
        :class="statusMeta(status).badgeClass"
    >
        <span class="size-1.5 rounded-full" :class="statusMeta(status).dotClass" />
        {{ statusMeta(status).label }}
    </span>
</template>
