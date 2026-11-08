<script setup lang="ts">
import PrinterConnectionPanel from './PrinterConnectionPanel.vue'
import PrinterStatusPill from './PrinterStatusPill.vue'
</script>

<template>
    <UiCard class="flex flex-col gap-6 p-5 sm:p-6">
        <header class="flex items-start justify-between gap-4">
            <div>
                <h2 class="font-display text-xl font-semibold text-on-surface">Conexión</h2>
                <p class="mt-1 text-sm text-on-surface-variant">
                    Elige cómo se comunica el sistema con la impresora.
                </p>
            </div>
            <PrinterStatusPill />
        </header>
        <PrinterConnectionPanel />
    </UiCard>
</template>
