<script setup lang="ts">
import { useLabelPrinterStore } from '../stores/label-printer.store'

const printerStore = useLabelPrinterStore()

const label = computed(() => {
    if (printerStore.status === 'connecting') return 'Conectando…'
    if (printerStore.status === 'printing') return 'Imprimiendo…'
    return printerStore.isConnected ? 'Conectada' : 'Sin conexión'
})
</script>

<template>
    <span
        :class="[
            'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
            printerStore.isConnected
                ? 'border-primary text-primary'
                : 'border-outline-variant text-on-surface-variant',
        ]"
    >
        <span
            :class="[
                'size-2 rounded-full',
                printerStore.isConnected ? 'bg-primary' : 'bg-on-surface-variant',
                printerStore.isBusy ? 'animate-pulse' : '',
            ]"
        />
        {{ label }}
    </span>
</template>
