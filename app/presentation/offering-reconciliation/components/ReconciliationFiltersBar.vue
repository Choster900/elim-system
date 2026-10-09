<script setup lang="ts">
import { Info } from '@lucide/vue'
import { formatLocalIsoDate } from '~/utils/date/date-format.util'
import { useReconciliationFilters } from '../composables/useReconciliationFilters'
import { periodOptions } from '../utils/period-presets.util'

const props = defineProps<{
    zones: { id: number; name: string }[]
}>()

const { filters, selectedPeriod, dateRange, selectedZone } = useReconciliationFilters()

const options = periodOptions()

const zoneOptions = computed(() =>
    props.zones.map((zone) => ({ value: zone.id, label: zone.name })),
)

function dayLabel(isoDate: string) {
    return formatLocalIsoDate(isoDate, { day: 'numeric', month: 'short', year: 'numeric' })
}

const periodLabel = computed(() =>
    filters.value.from === filters.value.to
        ? `el ${dayLabel(filters.value.from)}`
        : `del ${dayLabel(filters.value.from)} al ${dayLabel(filters.value.to)}`,
)

const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div class="w-full sm:w-64">
                <label :class="labelClass">Periodo</label>
                <UiSearchSelect
                    v-model="selectedPeriod"
                    :options="options"
                    option-description="description"
                    :searchable="false"
                    aria-label="Periodo de recepción"
                />
            </div>
            <div v-if="selectedPeriod === 'personalizado'" class="w-full sm:w-80">
                <label :class="labelClass">Fechas</label>
                <UiDatePicker
                    v-model="dateRange"
                    mode="range"
                    :clearable="false"
                    placeholder="Elige las fechas"
                />
            </div>
            <div v-if="zoneOptions.length > 1 || selectedZone" class="w-full sm:w-56">
                <label :class="labelClass">Zona</label>
                <UiSearchSelect
                    v-model="selectedZone"
                    :options="zoneOptions"
                    clearable
                    placeholder="Todas las zonas"
                    search-placeholder="Buscar zona..."
                    aria-label="Filtrar por zona"
                />
            </div>
        </div>
        <p class="flex items-start gap-2 text-xs text-on-surface-variant">
            <Info class="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
                Mostrando los sobres que el comité recibió
                <strong class="text-on-surface">{{ periodLabel }}</strong
                >. Los sobres <strong class="text-on-surface">sin entregar</strong> aparecen
                siempre, sin importar la fecha.
            </span>
        </p>
    </div>
</template>
