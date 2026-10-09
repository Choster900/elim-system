<script setup lang="ts">
import { AlertTriangle, CheckCircle2 } from '@lucide/vue'
import type { ReceptionStatus } from '../interfaces/reception.interface'
import { statusLabel } from '../utils/reception-format.util'

defineProps<{
    status: ReceptionStatus
}>()
</script>

<template>
    <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
        :class="
            status === 'cuadra'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        "
    >
        <CheckCircle2 v-if="status === 'cuadra'" class="size-3.5" />
        <AlertTriangle v-else class="size-3.5" />
        {{ statusLabel(status) }}
    </span>
</template>
