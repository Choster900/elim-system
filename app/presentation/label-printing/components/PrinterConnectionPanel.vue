<script setup lang="ts">
import type { Component } from 'vue'
import {
    Bluetooth,
    CircleAlert,
    FlaskConical,
    Printer,
    RefreshCw,
    Search,
    Unplug,
    Usb,
} from '@lucide/vue'
import {
    labelPrinterAdapters,
    type LabelPrinterAdapterId,
    type LabelPrinterSupport,
} from '~/infrastructure/label-printing'
import {
    checkLabelPrinterAdapterSupport,
    useLabelPrinterStore,
} from '../stores/label-printer.store'

const ADAPTER_ICONS: Record<LabelPrinterAdapterId, Component> = {
    'niimbot-bluetooth': Bluetooth,
    'niimbot-serial': Usb,
    simulator: FlaskConical,
}

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const printerStore = useLabelPrinterStore()
const supportByAdapter = ref<Partial<Record<LabelPrinterAdapterId, LabelPrinterSupport>>>({})
const connectingDeviceId = ref<string | null>(null)

const adapterOptions = computed(() =>
    labelPrinterAdapters.map((adapter) => ({
        ...adapter,
        icon: ADAPTER_ICONS[adapter.id],
        supported: supportByAdapter.value[adapter.id]?.supported ?? true,
    })),
)
const unsupportedReason = computed(() => {
    const support = supportByAdapter.value[printerStore.adapterId]
    return support && !support.supported ? support.reason : null
})
const printerDetails = computed(() => {
    const printer = printerStore.printer
    if (!printer) return []
    return [
        { label: 'Modelo', value: printer.model },
        { label: 'Resolución', value: `${printer.dpi} dpi` },
        {
            label: 'Cabezal',
            value: printer.printheadPx
                ? `${Math.floor((printer.printheadPx * 25.4) / printer.dpi)} mm`
                : '—',
        },
        {
            label: 'Batería',
            value: printer.batteryPercent !== undefined ? `${printer.batteryPercent} %` : '—',
        },
        { label: 'Firmware', value: printer.firmware || '—' },
    ]
})

async function connectTo(deviceId?: string) {
    connectingDeviceId.value = deviceId ?? null
    try {
        await printerStore.connect(deviceId)
    } finally {
        connectingDeviceId.value = null
    }
}

onMounted(() => {
    printerStore.loadPreferences()
    supportByAdapter.value = Object.fromEntries(
        labelPrinterAdapters.map((adapter) => [
            adapter.id,
            checkLabelPrinterAdapterSupport(adapter.id),
        ]),
    )
    void printerStore.refreshDevices()
})
</script>

<template>
    <div :class="['flex flex-col', compact ? 'gap-4' : 'gap-6']">
        <div class="grid gap-2" role="radiogroup" aria-label="Controlador de impresora">
            <button
                v-for="adapter in adapterOptions"
                :key="adapter.id"
                type="button"
                role="radio"
                :aria-checked="printerStore.adapterId === adapter.id"
                :disabled="printerStore.isBusy"
                :class="[
                    'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
                    printerStore.adapterId === adapter.id
                        ? 'border-primary bg-primary/10'
                        : 'border-outline-variant hover:border-primary/60',
                ]"
                @click="printerStore.selectAdapter(adapter.id)"
            >
                <span
                    :class="[
                        'flex size-9 shrink-0 items-center justify-center rounded-md',
                        printerStore.adapterId === adapter.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface-container-high text-on-surface-variant',
                    ]"
                >
                    <component :is="adapter.icon" class="size-4" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-on-surface">
                        {{ adapter.label }}
                    </span>
                    <span class="block text-xs text-on-surface-variant">
                        {{ adapter.description }}
                    </span>
                </span>
                <UiBadge v-if="!adapter.supported" variant="outline" class="shrink-0 rounded-md">
                    No disponible
                </UiBadge>
            </button>
        </div>

        <p
            v-if="printerStore.connectionError"
            class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
        >
            <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {{ printerStore.connectionError }}
        </p>

        <section
            v-if="printerStore.isConnected && printerStore.printer"
            class="flex flex-col gap-4"
        >
            <div
                class="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3"
            >
                <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                >
                    <Printer class="size-5" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-on-surface">
                        {{ printerStore.printer.deviceName }}
                    </p>
                    <p class="text-xs text-on-surface-variant">
                        {{ printerStore.selectedAdapter.label }}
                    </p>
                </div>
            </div>
            <dl
                :class="[
                    'grid',
                    compact ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-3 sm:grid-cols-3',
                ]"
            >
                <div
                    v-for="detail in printerDetails"
                    :key="detail.label"
                    class="rounded-md border border-outline-variant px-3 py-2"
                >
                    <dt
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        {{ detail.label }}
                    </dt>
                    <dd class="mt-1 truncate text-sm font-semibold text-on-surface">
                        {{ detail.value }}
                    </dd>
                </div>
            </dl>
            <UiButton
                variant="outline"
                :disabled="printerStore.status === 'printing'"
                @click="printerStore.disconnect()"
            >
                <Unplug /> Desconectar
            </UiButton>
        </section>

        <section v-else class="flex flex-col gap-4">
            <div
                v-if="unsupportedReason"
                class="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
                role="status"
            >
                <CircleAlert class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div class="grid gap-2">
                    <p class="font-semibold text-on-surface">
                        {{ printerStore.selectedAdapter.label }} no está disponible aquí
                    </p>
                    <p>{{ unsupportedReason }}</p>
                    <p>Mientras tanto, puedes probar todo el flujo con el Simulador.</p>
                </div>
            </div>
            <template v-else>
                <div class="flex items-center justify-between gap-3">
                    <h3
                        class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Impresoras autorizadas
                    </h3>
                    <UiButton
                        variant="ghost"
                        size="icon"
                        class="size-8"
                        aria-label="Actualizar lista"
                        :loading="printerStore.loadingDevices"
                        @click="printerStore.refreshDevices()"
                    >
                        <RefreshCw v-if="!printerStore.loadingDevices" />
                    </UiButton>
                </div>
                <ul v-if="printerStore.devices.length" class="grid gap-2">
                    <li
                        v-for="device in printerStore.devices"
                        :key="device.id"
                        class="flex items-center justify-between gap-3 rounded-lg border border-outline-variant px-4 py-2.5"
                    >
                        <span class="truncate text-sm font-medium text-on-surface">
                            {{ device.name }}
                        </span>
                        <UiButton
                            size="sm"
                            variant="secondary"
                            :disabled="printerStore.isBusy"
                            :loading="connectingDeviceId === device.id"
                            @click="connectTo(device.id)"
                        >
                            Conectar
                        </UiButton>
                    </li>
                </ul>
                <p
                    v-else
                    class="rounded-lg border border-dashed border-outline-variant px-4 py-3 text-sm text-on-surface-variant"
                >
                    Este navegador todavía no tiene impresoras autorizadas. Búscala una vez y
                    quedará en la lista.
                </p>
                <UiButton
                    :disabled="printerStore.isBusy"
                    :loading="printerStore.status === 'connecting' && connectingDeviceId === null"
                    @click="connectTo()"
                >
                    <Search v-if="printerStore.status !== 'connecting'" /> Buscar impresora
                </UiButton>
            </template>
        </section>
    </div>
</template>
