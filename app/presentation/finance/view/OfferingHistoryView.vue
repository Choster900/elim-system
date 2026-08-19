<script setup lang="ts">
import { ArrowLeft, FilterX, History, Search, TrendingUp, Users } from '@lucide/vue'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useOccurrencesQuery } from '../composables/useOccurrenceQueries'
import type { OccurrenceFilters, OccurrenceRecord } from '../interfaces/occurrence.interface'

defineOptions({ name: 'OfferingHistoryView' })

useHead({ title: 'Historial de ofrendas · Sistema' })

const search = ref('')
const dateRange = ref<DatePickerRange>({ start: null, end: null })
const selectedDistrict = ref<number | null>(null)
const selectedZone = ref<number | null>(null)
const selectedSector = ref<number | null>(null)

// El rango de fechas viaja al servidor, que ya sabe acotar por fecha; el territorio
// se filtra sobre lo recibido, que es justo el alcance del usuario.
const filters = computed<OccurrenceFilters>(() => ({
    status: 'registrada',
    ...(dateRange.value.start ? { from: dateRange.value.start } : {}),
    ...(dateRange.value.end ? { to: dateRange.value.end } : {}),
}))

const historyQuery = useOccurrencesQuery(filters)

const occurrences = computed(() => historyQuery.data.value ?? [])

/// Opciones únicas, ordenadas y derivadas de lo que realmente hay.
function optionsOf(
    list: OccurrenceRecord[],
    id: keyof OccurrenceRecord,
    name: keyof OccurrenceRecord,
) {
    const map = new Map<number, string>()
    for (const item of list) map.set(item[id] as number, item[name] as string)
    return [...map.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) => left.label.localeCompare(right.label, 'es'))
}

const districtOptions = computed(() => optionsOf(occurrences.value, 'districtId', 'districtName'))

const zoneOptions = computed(() =>
    optionsOf(
        occurrences.value.filter(
            (item) => !selectedDistrict.value || item.districtId === selectedDistrict.value,
        ),
        'zoneId',
        'zoneName',
    ),
)

const sectorOptions = computed(() =>
    optionsOf(
        occurrences.value.filter(
            (item) =>
                (!selectedDistrict.value || item.districtId === selectedDistrict.value) &&
                (!selectedZone.value || item.zoneId === selectedZone.value),
        ),
        'sectorId',
        'sectorName',
    ),
)

// Cambiar un nivel invalida los de abajo: dejar un sector de otra zona no filtra nada.
watch(selectedDistrict, () => {
    selectedZone.value = null
    selectedSector.value = null
})
watch(selectedZone, () => {
    selectedSector.value = null
})

const hasFilters = computed(
    () =>
        !!search.value ||
        !!dateRange.value.start ||
        !!dateRange.value.end ||
        selectedDistrict.value !== null ||
        selectedZone.value !== null ||
        selectedSector.value !== null,
)

function clearFilters() {
    search.value = ''
    dateRange.value = { start: null, end: null }
    selectedDistrict.value = null
    selectedZone.value = null
    selectedSector.value = null
}

const visible = computed(() => {
    const term = search.value.trim().toLocaleLowerCase('es')

    return occurrences.value.filter((item) => {
        if (selectedDistrict.value && item.districtId !== selectedDistrict.value) return false
        if (selectedZone.value && item.zoneId !== selectedZone.value) return false
        if (selectedSector.value && item.sectorId !== selectedSector.value) return false
        if (!term) return true

        return [item.meetingCode, item.meetingTitle, item.sectorName, item.recordedByName ?? '']
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(term)
    })
})

const stats = computed(() => {
    const total = visible.value.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const attendance = visible.value.reduce((sum, item) => sum + (item.attendance ?? 0), 0)
    const count = visible.value.length

    return {
        count,
        total,
        attendance,
        average: count > 0 ? total / count : 0,
        perAttendee: attendance > 0 ? total / attendance : 0,
    }
})

/// Una fecha del eje puede tener varias reuniones: se suman.
const trendByDate = computed(() => {
    const byDate = new Map<string, number>()
    for (const item of visible.value) {
        byDate.set(item.date, (byDate.get(item.date) ?? 0) + (item.totalAmount ?? 0))
    }

    return [...byDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-12)
        .map(([date, value]) => ({ label: date.slice(5).replace('-', '/'), value }))
})

const attendanceByDate = computed(() => {
    const byDate = new Map<string, number>()
    for (const item of visible.value) {
        byDate.set(item.date, (byDate.get(item.date) ?? 0) + (item.attendance ?? 0))
    }

    return [...byDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-12)
        .map(([date, value]) => ({ label: date.slice(5).replace('-', '/'), value }))
})

const byMeeting = computed(() => {
    const map = new Map<number, { label: string; value: number; dates: number }>()

    for (const item of visible.value) {
        const current = map.get(item.meetingId) ?? {
            label: `${item.meetingCode} · ${item.meetingTitle}`,
            value: 0,
            dates: 0,
        }
        current.value += item.totalAmount ?? 0
        current.dates += 1
        map.set(item.meetingId, current)
    }

    return [...map.entries()].map(([id, entry]) => ({
        id,
        label: entry.label,
        value: entry.value,
        meta: `${entry.dates} ${entry.dates === 1 ? 'fecha' : 'fechas'}`,
    }))
})

const bySector = computed(() => {
    const map = new Map<string, number>()
    for (const item of visible.value) {
        map.set(item.sectorName, (map.get(item.sectorName) ?? 0) + (item.totalAmount ?? 0))
    }

    return [...map.entries()].map(([label, value]) => ({ id: label, label, value }))
})

/// Composición de la asistencia: cuántas personas de cada tipo hay tras el total.
const byAttendanceType = computed(() => {
    const map = new Map<number, { label: string; value: number }>()

    for (const item of visible.value) {
        for (const detail of item.attendanceDetails) {
            const current = map.get(detail.typeId) ?? {
                label: detail.typeName ?? 'Sin tipo',
                value: 0,
            }
            current.value += detail.quantity
            map.set(detail.typeId, current)
        }
    }

    return [...map.entries()].map(([id, entry]) => ({ id, ...entry }))
})

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openMeeting(meetingId: number) {
    return navigateTo(`/finanzas/ofrendas/reunion/${meetingId}`)
}

// Solo lo usa el buscador de texto; los selectores de territorio son UiSearchSelect.
const controlClass =
    'rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary'
const filterLabelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-24 pt-24 lg:px-10">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <section class="border-b border-outline-variant pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Historial
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                Ofrendas registradas
            </h1>
            <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Todo lo que ya fue capturado, con su tendencia en el tiempo y de dónde viene.
            </p>
        </section>

        <!-- Filtros: territorio en cascada, rango de fechas y búsqueda -->
        <section class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                    <span :class="filterLabelClass">Distrito</span>
                    <UiSearchSelect
                        v-model="selectedDistrict"
                        :options="districtOptions"
                        clearable
                        placeholder="Todos los distritos"
                        search-placeholder="Buscar distrito..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Zona</span>
                    <UiSearchSelect
                        v-model="selectedZone"
                        :options="zoneOptions"
                        clearable
                        :disabled="zoneOptions.length === 0"
                        placeholder="Todas las zonas"
                        search-placeholder="Buscar zona..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Sector</span>
                    <UiSearchSelect
                        v-model="selectedSector"
                        :options="sectorOptions"
                        clearable
                        :disabled="sectorOptions.length === 0"
                        placeholder="Todos los sectores"
                        search-placeholder="Buscar sector..."
                    />
                </div>
                <div>
                    <span :class="filterLabelClass">Entre fechas</span>
                    <UiDatePicker
                        v-model="dateRange"
                        mode="range"
                        placeholder="Todo el historial"
                    />
                </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-3">
                <div class="relative min-w-[240px] flex-1">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                        v-model="search"
                        type="search"
                        placeholder="Buscar por código, reunión, sector o quién registró"
                        aria-label="Buscar por código, reunión, sector o quién registró"
                        :class="[controlClass, 'w-full py-2 pl-9 pr-3']"
                    />
                </div>
                <button
                    v-if="hasFilters"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                    @click="clearFilters"
                >
                    <FilterX class="size-3.5" /> Limpiar
                </button>
            </div>
        </section>

        <div
            v-if="historyQuery.isPending.value"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center text-sm text-on-surface-variant"
        >
            Cargando historial…
        </div>

        <div
            v-else-if="visible.length === 0"
            class="mt-8 rounded-xl border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
        >
            <History class="mx-auto size-10 text-primary" />
            <h2 class="mt-3 font-display text-2xl font-semibold text-on-surface">Sin registros</h2>
            <p class="mt-2 text-sm text-on-surface-variant">
                {{
                    hasFilters
                        ? 'Ningún registro coincide con los filtros aplicados.'
                        : 'Todavía no hay fechas registradas en tu alcance.'
                }}
            </p>
            <UiButton
                v-if="hasFilters"
                variant="outline"
                type="button"
                class="mt-4 h-10 rounded px-5 text-xs uppercase tracking-wider"
                @click="clearFilters"
            >
                Limpiar filtros
            </UiButton>
        </div>

        <template v-else>
            <!-- Cifras de cabecera -->
            <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Total recolectado
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.total) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">
                        en {{ stats.count }} {{ stats.count === 1 ? 'fecha' : 'fechas' }}
                    </p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda promedio
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.average) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">por reunión registrada</p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Asistencia acumulada
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        {{ stats.attendance }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">personas contadas</p>
                </UiCard>
                <UiCard class="p-5">
                    <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda por persona
                    </p>
                    <p
                        class="mt-2 font-display text-3xl font-semibold tabular-nums text-on-surface"
                    >
                        ${{ formatMoney(stats.perAttendee) }}
                    </p>
                    <p class="mt-1 text-xs text-on-surface-variant">promedio general</p>
                </UiCard>
            </section>

            <!-- Tendencia: dos medidas de escala distinta, dos gráficos -->
            <section class="mt-6 grid gap-4 xl:grid-cols-2">
                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <TrendingUp class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Ofrenda por fecha</h2>
                        <span class="ml-auto text-[11px] text-on-surface-variant">
                            últimas {{ trendByDate.length }}
                        </span>
                    </div>
                    <TrendChart
                        :values="trendByDate"
                        format="currency"
                        label="Ofrenda recolectada por fecha"
                    />
                </UiCard>

                <UiCard class="p-6">
                    <div class="mb-5 flex items-center gap-2">
                        <Users class="size-4 text-primary" />
                        <h2 class="text-sm font-semibold text-on-surface">Asistencia por fecha</h2>
                        <span class="ml-auto text-[11px] text-on-surface-variant">
                            últimas {{ attendanceByDate.length }}
                        </span>
                    </div>
                    <TrendChart
                        :values="attendanceByDate"
                        color="var(--chart-2)"
                        label="Asistencia por fecha"
                    />
                </UiCard>
            </section>

            <!-- De dónde viene -->
            <section class="mt-4 grid gap-4 xl:grid-cols-2">
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">Por reunión</h2>
                    <RankedBarList
                        :items="byMeeting"
                        label="Ofrenda acumulada por reunión"
                        empty-message="Sin reuniones registradas."
                    />
                </UiCard>
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">Por sector</h2>
                    <RankedBarList
                        :items="bySector"
                        label="Ofrenda acumulada por sector"
                        empty-message="Sin sectores registrados."
                    />
                </UiCard>
            </section>

            <!-- Quiénes son los que asisten -->
            <section v-if="byAttendanceType.length > 0" class="mt-4">
                <UiCard class="p-6">
                    <h2 class="mb-5 text-sm font-semibold text-on-surface">
                        Composición de la asistencia
                    </h2>
                    <RankedBarList
                        :items="byAttendanceType"
                        format="number"
                        label="Asistencia acumulada por tipo"
                        empty-message="Las fechas visibles no tienen desglose de asistencia."
                    />
                </UiCard>
            </section>

            <!-- Detalle -->
            <section class="mt-8">
                <h2 class="mb-4 font-display text-xl font-semibold text-on-surface">
                    Detalle por fecha
                </h2>
                <div class="overflow-x-auto rounded-xl border border-outline-variant">
                    <table class="w-full min-w-[760px] border-collapse text-sm">
                        <thead>
                            <tr class="bg-surface-container-high text-on-surface-variant">
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Fecha
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Reunión
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Sector
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Asistencia
                                </th>
                                <th
                                    class="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Ofrenda
                                </th>
                                <th
                                    class="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                >
                                    Registró
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in visible"
                                :key="item.id"
                                class="cursor-pointer border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                                @click="openMeeting(item.meetingId)"
                            >
                                <td
                                    class="whitespace-nowrap px-4 py-3 tabular-nums text-on-surface"
                                >
                                    {{ formatShortIsoDate(item.date) }}
                                </td>
                                <td class="px-4 py-3 text-on-surface">
                                    <span class="flex items-center gap-2">
                                        <span
                                            class="size-2 shrink-0 rounded-full"
                                            :style="{ backgroundColor: item.meetingColor }"
                                        />
                                        {{ item.meetingTitle }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-on-surface-variant">
                                    {{ item.sectorName }}
                                </td>
                                <td
                                    class="px-4 py-3 text-right tabular-nums text-on-surface-variant"
                                >
                                    {{ item.attendance ?? '—' }}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-semibold tabular-nums text-on-surface"
                                >
                                    ${{ formatMoney(item.totalAmount ?? 0) }}
                                </td>
                                <td class="px-4 py-3 text-on-surface-variant">
                                    {{ item.recordedByName ?? '—' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </template>
    </main>
</template>
