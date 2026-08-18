<script setup lang="ts">
import { ArrowLeft, History, Search } from '@lucide/vue'
import { formatShortIsoDate } from '~/utils/date/date-format.util'
import { useOccurrencesQuery } from '../composables/useOccurrenceQueries'
import type { OccurrenceFilters } from '../interfaces/occurrence.interface'

defineOptions({ name: 'OfferingHistoryView' })

useHead({ title: 'Historial de ofrendas · Sistema' })

const filters = ref<OccurrenceFilters>({ status: 'registrada' })
const search = ref('')

const historyQuery = useOccurrencesQuery(filters)

const occurrences = computed(() => historyQuery.data.value ?? [])

const visible = computed(() => {
    const term = search.value.trim().toLocaleLowerCase('es')
    if (!term) return occurrences.value
    return occurrences.value.filter((item) =>
        [item.meetingTitle, item.sectorName, item.recordedByName ?? '']
            .join(' ')
            .toLocaleLowerCase('es')
            .includes(term),
    )
})

const stats = computed(() => ({
    count: visible.value.length,
    total: visible.value.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0),
    attendance: visible.value.reduce((sum, item) => sum + (item.attendance ?? 0), 0),
}))

function formatMoney(value: number) {
    return value.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openMeeting(meetingId: number) {
    return navigateTo(`/finanzas/ofrendas/reunion/${meetingId}`)
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
            @click="navigateTo('/finanzas/ofrendas')"
        >
            <ArrowLeft class="size-4" /> Volver a pendientes
        </button>

        <section class="border-b border-outline-variant pb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.4em] text-on-surface-variant">
                Finanzas · Historial
            </p>
            <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface">
                Ofrendas registradas
            </h1>
            <p class="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Todas las fechas que ya tienen asistencia y ofrenda capturadas, con el nombre de
                quien las registró.
            </p>
        </section>

        <section class="mt-8 grid gap-4 md:grid-cols-3">
            <UiCard class="p-5">
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Fechas registradas
                </p>
                <h3 class="mt-1 font-display text-2xl font-semibold tabular-nums text-on-surface">
                    {{ stats.count }}
                </h3>
            </UiCard>
            <UiCard class="p-5">
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Total recolectado
                </p>
                <h3 class="mt-1 font-display text-2xl font-semibold tabular-nums text-on-surface">
                    ${{ formatMoney(stats.total) }}
                </h3>
            </UiCard>
            <UiCard class="p-5">
                <p
                    class="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                    Asistencia acumulada
                </p>
                <h3 class="mt-1 font-display text-2xl font-semibold tabular-nums text-on-surface">
                    {{ stats.attendance }}
                </h3>
            </UiCard>
        </section>

        <section class="mt-8">
            <div class="relative mb-4 max-w-md">
                <Search
                    class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                    v-model="search"
                    type="search"
                    placeholder="Buscar por reunión, sector o quién registró"
                    class="w-full rounded border border-outline-variant bg-surface py-2 pl-9 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
                />
            </div>

            <div
                v-if="historyQuery.isPending.value"
                class="rounded-lg border border-outline-variant bg-surface-container-low px-6 py-12 text-center text-sm text-on-surface-variant"
            >
                Cargando historial…
            </div>

            <div
                v-else-if="visible.length === 0"
                class="rounded-lg border border-outline-variant bg-surface-container-low px-6 py-16 text-center"
            >
                <History class="mx-auto size-10 text-primary" />
                <h3 class="mt-3 font-display text-2xl font-semibold text-on-surface">
                    Sin registros
                </h3>
                <p class="mt-2 text-sm text-on-surface-variant">
                    Todavía no hay fechas registradas en tu alcance.
                </p>
            </div>

            <div v-else class="overflow-x-auto rounded-lg border border-outline-variant">
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
                            class="cursor-pointer border-t border-outline-variant hover:bg-surface-container-low"
                            @click="openMeeting(item.meetingId)"
                        >
                            <td class="whitespace-nowrap px-4 py-3 tabular-nums text-on-surface">
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
                            <td class="px-4 py-3 text-on-surface-variant">{{ item.sectorName }}</td>
                            <td class="px-4 py-3 text-right tabular-nums text-on-surface-variant">
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
    </main>
</template>
