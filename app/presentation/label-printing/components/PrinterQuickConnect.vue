<script setup lang="ts">
import type { Component } from 'vue'
import { Bluetooth, CircleAlert, CircleCheck, FlaskConical, Search, Usb } from '@lucide/vue'
import type { LabelPrinterAdapterId } from '~/infrastructure/label-printing'
import { usePrinterConnection } from '../composables/usePrinterConnection'

interface ConnectionOption {
    id: LabelPrinterAdapterId
    icon: Component
    label: string
    hint: string
    help: string
    action: string
    actionIcon: Component
    showsKnownDevices: boolean
}

const CONNECTION_OPTIONS: ConnectionOption[] = [
    {
        id: 'niimbot-bluetooth',
        icon: Bluetooth,
        label: 'Bluetooth',
        hint: 'Sin cables',
        help: 'Enciende la impresora y elígela en la ventana que aparecerá.',
        action: 'Buscar impresora',
        actionIcon: Search,
        showsKnownDevices: true,
    },
    {
        id: 'niimbot-serial',
        icon: Usb,
        label: 'Cable USB',
        hint: 'Con cable',
        help: 'Conecta el cable y elige la impresora en la ventana que aparecerá.',
        action: 'Buscar impresora',
        actionIcon: Search,
        showsKnownDevices: true,
    },
    {
        id: 'simulator',
        icon: FlaskConical,
        label: 'Prueba',
        hint: 'Sin impresora',
        help: 'Simula la impresión sin gastar papel.',
        action: 'Usar modo prueba',
        actionIcon: FlaskConical,
        showsKnownDevices: false,
    },
]

const {
    printerStore,
    connectingDeviceId,
    unsupportedReason,
    isSearching,
    isAdapterSupported,
    connectTo,
} = usePrinterConnection()

const selectedOption = computed(() =>
    CONNECTION_OPTIONS.find((option) => option.id === printerStore.adapterId),
)
const knownDevices = computed(() =>
    selectedOption.value?.showsKnownDevices ? printerStore.devices : [],
)
const printerSummary = computed(() => {
    const printer = printerStore.printer
    if (!printer) return ''
    const battery =
        printer.batteryPercent !== undefined ? `Batería ${printer.batteryPercent} %` : ''
    return [printer.deviceName, battery].filter(Boolean).join(' · ')
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <div
            v-if="printerStore.isConnected && printerStore.printer"
            class="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3"
        >
            <CircleCheck class="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-on-surface">Lista para imprimir</p>
                <p class="truncate text-xs text-on-surface-variant">{{ printerSummary }}</p>
            </div>
            <UiButton
                variant="ghost"
                size="sm"
                :disabled="printerStore.status === 'printing'"
                @click="printerStore.disconnect()"
            >
                Cambiar
            </UiButton>
        </div>

        <template v-else>
            <div class="grid gap-2">
                <p class="text-sm font-medium text-on-surface">¿Cómo se conecta tu impresora?</p>
                <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de conexión">
                    <button
                        v-for="option in CONNECTION_OPTIONS"
                        :key="option.id"
                        type="button"
                        role="radio"
                        :aria-checked="printerStore.adapterId === option.id"
                        :disabled="printerStore.isBusy"
                        :class="[
                            'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
                            printerStore.adapterId === option.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-outline-variant text-on-surface-variant hover:border-primary/60',
                        ]"
                        @click="printerStore.selectAdapter(option.id)"
                    >
                        <component :is="option.icon" class="size-5" aria-hidden="true" />
                        <span class="text-sm font-semibold text-on-surface">{{
                            option.label
                        }}</span>
                        <span class="text-[11px] leading-tight">
                            {{ isAdapterSupported(option.id) ? option.hint : 'No disponible' }}
                        </span>
                    </button>
                </div>
            </div>

            <p
                v-if="unsupportedReason"
                class="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
                role="status"
            >
                {{ unsupportedReason }}
            </p>

            <template v-else>
                <div v-if="knownDevices.length" class="grid gap-2">
                    <p class="text-xs font-medium text-on-surface-variant">Usada antes</p>
                    <button
                        v-for="device in knownDevices"
                        :key="device.id"
                        type="button"
                        class="flex items-center justify-between gap-3 rounded-lg border border-outline-variant px-4 py-2.5 text-left transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="printerStore.isBusy"
                        @click="connectTo(device.id)"
                    >
                        <span class="truncate text-sm font-medium text-on-surface">
                            {{ device.name }}
                        </span>
                        <span class="shrink-0 text-xs font-semibold text-primary">
                            {{ connectingDeviceId === device.id ? 'Conectando…' : 'Conectar' }}
                        </span>
                    </button>
                </div>

                <div v-if="selectedOption" class="grid gap-2">
                    <UiButton
                        size="lg"
                        :disabled="printerStore.isBusy"
                        :loading="isSearching"
                        @click="connectTo()"
                    >
                        <component :is="selectedOption.actionIcon" v-if="!isSearching" />
                        {{ selectedOption.action }}
                    </UiButton>
                    <p class="text-center text-xs text-on-surface-variant">
                        {{ selectedOption.help }}
                    </p>
                </div>
            </template>
        </template>

        <p
            v-if="printerStore.connectionError"
            class="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
        >
            <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {{ printerStore.connectionError }}
        </p>
    </div>
</template>
