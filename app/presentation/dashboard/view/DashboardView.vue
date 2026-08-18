<script setup lang="ts">
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CalendarPlus,
    CircleDollarSign,
    Clock3,
    HandCoins,
    MapPin,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    UserPlus,
    UsersRound,
} from '@lucide/vue'
import DashboardDonutChart from '~/presentation/dashboard/components/DashboardDonutChart.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import { useDashboardQuery } from '~/presentation/dashboard/composables/useDashboardQuery'
import type {
    DashboardMetric,
    DashboardPeriodDays,
} from '~/presentation/dashboard/interfaces/dashboard.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'

defineOptions({ name: 'DashboardView' })

useHead({ title: 'Dashboard · Sistema' })

const authStore = useAuthStore()
const toast = useAppToast()
const selectedPeriod = ref<DashboardPeriodDays>(30)
const selectedDistrictId = ref<number | null>(null)
const dashboardQuery = useDashboardQuery(selectedPeriod, selectedDistrictId)
const summary = computed(() => dashboardQuery.data.value ?? null)
const isLoading = computed(() => dashboardQuery.isPending.value)
const isRefreshing = computed(() => dashboardQuery.isFetching.value && !isLoading.value)

const periodOptions: Array<{ value: DashboardPeriodDays; label: string }> = [
    { value: 30, label: '30 días' },
    { value: 90, label: '90 días' },
    { value: 365, label: '12 meses' },
]
const districtOptions = computed(
    () =>
        summary.value?.filters.districts.map((district) => ({
            value: district.id,
            label: district.name,
        })) ?? [],
)
const attendanceTrend = computed(
    () =>
        summary.value?.trends.map((point) => ({
            label: point.label,
            value: point.attendance,
        })) ?? [],
)
const offeringTrend = computed(
    () =>
        summary.value?.trends.map((point) => ({
            label: point.label,
            value: point.offerings,
        })) ?? [],
)
const maximumDistrictOffering = computed(() =>
    Math.max(
        1,
        ...(summary.value?.districtPerformance.map((district) => district.offerings) ?? []),
    ),
)

const canCreateMembers = computed(() => authStore.hasPermission('members.create'))
const canManageMeetings = computed(() => authStore.hasPermission('meetings.manage'))
const canViewMeetings = computed(() => authStore.hasPermission('meetings.view'))
const canManageFinance = computed(() => authStore.hasPermission('finance.manage'))
const canViewFinance = computed(() => authStore.hasPermission('finance.view'))
const hasQuickActions = computed(
    () => canCreateMembers.value || canManageMeetings.value || canManageFinance.value,
)

if (import.meta.server) {
    onServerPrefetch(() =>
        dashboardQuery
            .suspense()
            .then(() => undefined)
            .catch(() => undefined),
    )
}

if (import.meta.client) {
    watch(
        () => dashboardQuery.error.value,
        (error) => {
            if (error) {
                toast.error(resolveHttpErrorMessage(error, 'No fue posible cargar el dashboard'))
            }
        },
        { immediate: true },
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 1 }).format(value)
}

function formatMoney(value: number, currency = 'USD') {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

function formatCompactMoney(value: number) {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
        notation: value >= 10000 ? 'compact' : 'standard',
        minimumFractionDigits: value >= 10000 ? 0 : 2,
        maximumFractionDigits: value >= 10000 ? 1 : 2,
    }).format(value)
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
    return new Intl.DateTimeFormat('es-SV', {
        day: '2-digit',
        month: 'short',
        ...options,
        timeZone: 'UTC',
    })
        .format(new Date(`${value}T00:00:00.000Z`))
        .replace('.', '')
}

function changeLabel(metric: DashboardMetric) {
    if (metric.changePercentage === null) return 'Sin datos en el período anterior'
    if (metric.changePercentage === 0) return 'Sin variación frente al período anterior'
    const direction = metric.changePercentage > 0 ? 'más' : 'menos'
    return `${formatNumber(Math.abs(metric.changePercentage))}% ${direction} que el período anterior`
}

const metricCards = computed(() => {
    if (!summary.value) return []
    return [
        {
            label: 'Ofrendas recolectadas',
            value: formatCompactMoney(summary.value.metrics.offerings.value),
            metric: summary.value.metrics.offerings,
            icon: HandCoins,
        },
        {
            label: 'Asistencia registrada',
            value: formatNumber(summary.value.metrics.attendance.value),
            metric: summary.value.metrics.attendance,
            icon: UsersRound,
        },
        {
            label: 'Reuniones documentadas',
            value: formatNumber(summary.value.metrics.registeredMeetings.value),
            metric: summary.value.metrics.registeredMeetings,
            icon: CalendarDays,
        },
        {
            label: 'Miembros activos',
            value: formatNumber(summary.value.metrics.activeMembers),
            metric: summary.value.metrics.newMembers,
            icon: Activity,
            customMeta: `${formatNumber(summary.value.metrics.newMembers.value)} incorporados en el período`,
            showChange: false,
        },
    ]
})

function openRecentOffering(id: number) {
    if (canManageFinance.value) navigateTo(`/finanzas/ofrendas/${id}/editar`)
    else if (canViewFinance.value) navigateTo('/finanzas/ofrendas')
}

function openMeeting(id: number) {
    if (canViewMeetings.value) navigateTo(`/catalogos/reuniones/${id}/editar`)
}
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header
            class="flex flex-col gap-8 border-b border-outline-variant pb-9 lg:flex-row lg:items-end lg:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.38em] text-primary">
                    Resumen ejecutivo
                </p>
                <h1 class="mt-4 font-display text-4xl font-semibold text-on-surface md:text-5xl">
                    Pulso de la comunidad
                </h1>
                <p class="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
                    Hola, {{ authStore.displayName }}. Consulta asistencia, ofrendas y actividad de
                    reuniones con información consolidada en tiempo real.
                </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="inline-flex rounded-lg border border-outline-variant bg-surface p-1">
                    <button
                        v-for="period in periodOptions"
                        :key="period.value"
                        type="button"
                        :class="[
                            'rounded-md px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                            selectedPeriod === period.value
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-on-surface-variant hover:bg-surface-container',
                        ]"
                        @click="selectedPeriod = period.value"
                    >
                        {{ period.label }}
                    </button>
                </div>
                <button
                    type="button"
                    class="flex size-10 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                    aria-label="Actualizar dashboard"
                    :disabled="dashboardQuery.isFetching.value"
                    @click="dashboardQuery.refetch()"
                >
                    <RefreshCw :class="['size-4', isRefreshing ? 'animate-spin' : '']" />
                </button>
            </div>
        </header>

        <section
            v-if="districtOptions.length > 1"
            class="mt-6 flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-on-surface">
                    Alcance territorial
                </p>
                <p class="mt-1 text-xs text-on-surface-variant">
                    Los indicadores de reuniones y ofrendas se recalculan para el distrito
                    seleccionado.
                </p>
            </div>
            <div class="w-full sm:w-72">
                <UiSearchSelect
                    v-model="selectedDistrictId"
                    :options="districtOptions"
                    clearable
                    placeholder="Todos los distritos"
                    search-placeholder="Buscar distrito..."
                />
            </div>
        </section>

        <section v-if="isLoading" class="mt-8 space-y-6" aria-label="Cargando dashboard">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="index in 4"
                    :key="index"
                    class="h-40 animate-pulse rounded-xl border border-outline-variant bg-surface-container"
                />
            </div>
            <div class="grid gap-6 lg:grid-cols-2">
                <div
                    v-for="index in 2"
                    :key="index"
                    class="h-96 animate-pulse rounded-xl border border-outline-variant bg-surface-container"
                />
            </div>
        </section>

        <section
            v-else-if="dashboardQuery.isError.value || !summary"
            class="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
        >
            <p class="font-display text-xl font-semibold text-on-surface">
                No fue posible construir el resumen
            </p>
            <p class="mt-2 text-sm text-on-surface-variant">
                Revisa la conexión e intenta actualizar nuevamente.
            </p>
            <UiButton type="button" class="mt-5 rounded" @click="dashboardQuery.refetch()">
                <RefreshCw class="mr-2 size-4" /> Reintentar
            </UiButton>
        </section>

        <template v-else>
            <section class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <UiCard
                    v-for="card in metricCards"
                    :key="card.label"
                    class="group relative overflow-hidden rounded-xl p-6 transition-colors hover:border-primary/60"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div
                            class="flex size-11 items-center justify-center rounded-lg bg-primary/10"
                        >
                            <component :is="card.icon" class="size-5 text-primary" />
                        </div>
                        <span
                            v-if="
                                card.showChange !== false && card.metric.changePercentage !== null
                            "
                            :class="[
                                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
                                card.metric.changePercentage >= 0
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-destructive/10 text-destructive',
                            ]"
                        >
                            <TrendingUp v-if="card.metric.changePercentage >= 0" class="size-3" />
                            <TrendingDown v-else class="size-3" />
                            {{ Math.abs(card.metric.changePercentage) }}%
                        </span>
                    </div>
                    <p
                        class="mt-6 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        {{ card.label }}
                    </p>
                    <p class="mt-1 font-display text-3xl font-semibold text-on-surface">
                        {{ card.value }}
                    </p>
                    <p class="mt-2 min-h-8 text-xs leading-4 text-on-surface-variant">
                        {{ card.customMeta ?? changeLabel(card.metric) }}
                    </p>
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-2">
                <UiCard class="rounded-xl p-6 md:p-8">
                    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                            >
                                Participación
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Tendencia de asistencia
                            </h2>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Personas registradas en
                                {{ summary.metrics.registeredMeetings.value }}
                                reuniones documentadas.
                            </p>
                        </div>
                        <div class="text-left sm:text-right">
                            <p class="text-xs text-on-surface-variant">Promedio por reunión</p>
                            <p class="font-display text-xl font-semibold text-on-surface">
                                {{ formatNumber(summary.metrics.averageAttendance) }}
                            </p>
                        </div>
                    </div>
                    <TrendChart
                        class="mt-6"
                        :values="attendanceTrend"
                        label="Tendencia de asistencia por período"
                        color="var(--chart-1)"
                    />
                </UiCard>

                <UiCard class="rounded-xl p-6 md:p-8">
                    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                            >
                                Finanzas
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Tendencia de ofrendas
                            </h2>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Recaudación consolidada por fecha de reunión.
                            </p>
                        </div>
                        <div class="text-left sm:text-right">
                            <p class="text-xs text-on-surface-variant">Promedio por reunión</p>
                            <p class="font-display text-xl font-semibold text-on-surface">
                                {{ formatCompactMoney(summary.metrics.averageOffering) }}
                            </p>
                        </div>
                    </div>
                    <TrendChart
                        class="mt-6"
                        :values="offeringTrend"
                        label="Tendencia de ofrendas por período"
                        color="var(--chart-2)"
                        format="currency"
                    />
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <UiCard class="rounded-xl p-6 md:p-8">
                    <div class="mb-7">
                        <p
                            class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                        >
                            Composición
                        </p>
                        <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                            Ofrendas por categoría
                        </h2>
                    </div>
                    <DashboardDonutChart
                        :items="summary.categoryDistribution"
                        total-label="Total recolectado"
                    />
                </UiCard>

                <UiCard class="rounded-xl p-6 md:p-8">
                    <div class="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                            >
                                Territorio
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Desempeño por distrito
                            </h2>
                        </div>
                        <span class="text-[10px] uppercase tracking-wider text-on-surface-variant">
                            Ofrendas
                        </span>
                    </div>

                    <div v-if="summary.districtPerformance.length" class="space-y-5">
                        <div
                            v-for="district in summary.districtPerformance"
                            :key="district.id"
                            class="space-y-2"
                        >
                            <div class="flex items-end justify-between gap-4">
                                <div>
                                    <p class="text-sm font-semibold text-on-surface">
                                        {{ district.name }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-on-surface-variant">
                                        {{ formatNumber(district.attendance) }} asistentes ·
                                        {{ district.meetingCount }} registros
                                    </p>
                                </div>
                                <p class="font-display text-sm font-semibold text-primary">
                                    {{ formatCompactMoney(district.offerings) }}
                                </p>
                            </div>
                            <div
                                class="h-2 overflow-hidden rounded-full bg-surface-container-highest"
                            >
                                <div
                                    class="h-full rounded-full bg-primary transition-[width] duration-500"
                                    :style="{
                                        width: `${Math.max(
                                            3,
                                            (district.offerings / maximumDistrictOffering) * 100,
                                        )}%`,
                                    }"
                                />
                            </div>
                        </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-on-surface-variant">
                        No hay registros territoriales en este período.
                    </p>
                </UiCard>
            </section>

            <section class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Cumplimiento de asistencia
                    </p>
                    <div class="mt-3 flex items-end gap-2">
                        <strong class="font-display text-2xl text-on-surface">
                            {{ formatNumber(summary.metrics.attendanceGoalRate) }}%
                        </strong>
                        <span class="pb-1 text-[11px] text-on-surface-variant">de lo esperado</span>
                    </div>
                    <div
                        class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
                    >
                        <div
                            class="h-full rounded-full bg-primary"
                            :style="{
                                width: `${Math.min(100, summary.metrics.attendanceGoalRate)}%`,
                            }"
                        />
                    </div>
                </div>
                <div class="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda por asistente
                    </p>
                    <strong class="mt-3 block font-display text-2xl text-on-surface">
                        {{ formatMoney(summary.metrics.offeringPerAttendee) }}
                    </strong>
                    <p class="mt-2 text-[11px] text-on-surface-variant">Promedio consolidado</p>
                </div>
                <div class="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Ofrenda promedio
                    </p>
                    <strong class="mt-3 block font-display text-2xl text-on-surface">
                        {{ formatMoney(summary.metrics.averageOffering) }}
                    </strong>
                    <p class="mt-2 text-[11px] text-on-surface-variant">Por reunión registrada</p>
                </div>
                <div class="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                    <p
                        class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                        Período analizado
                    </p>
                    <strong class="mt-3 block font-display text-lg text-on-surface">
                        {{ formatDate(summary.period.startDate) }} –
                        {{ formatDate(summary.period.endDate) }}
                    </strong>
                    <p class="mt-2 text-[11px] text-on-surface-variant">
                        {{ summary.period.days }} días de actividad
                    </p>
                </div>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <UiCard class="overflow-hidden rounded-xl">
                    <div
                        class="flex items-end justify-between gap-4 border-b border-outline-variant p-6 md:px-8"
                    >
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                            >
                                Últimos registros
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Asistencia y ofrendas
                            </h2>
                        </div>
                        <button
                            v-if="canViewFinance"
                            type="button"
                            class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
                            @click="navigateTo('/finanzas/ofrendas')"
                        >
                            Ver todos <ArrowRight class="size-3.5" />
                        </button>
                    </div>

                    <div
                        v-if="summary.recentOfferings.length"
                        class="divide-y divide-outline-variant"
                    >
                        <button
                            v-for="offering in summary.recentOfferings"
                            :key="offering.id"
                            type="button"
                            :class="[
                                'grid w-full grid-cols-[1fr_auto] gap-4 px-6 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_120px_130px] md:px-8',
                                canViewFinance
                                    ? 'hover:bg-surface-container-low'
                                    : 'cursor-default',
                            ]"
                            @click="openRecentOffering(offering.id)"
                        >
                            <div class="min-w-0">
                                <p class="truncate text-sm font-semibold text-on-surface">
                                    {{ offering.meetingTitle }}
                                </p>
                                <p class="mt-1 truncate text-[11px] text-on-surface-variant">
                                    {{ offering.districtName }} · {{ formatDate(offering.date) }}
                                </p>
                            </div>
                            <div class="hidden self-center text-right md:block">
                                <p class="text-sm font-semibold text-on-surface">
                                    {{ offering.attendance }}
                                </p>
                                <p class="text-[10px] uppercase text-on-surface-variant">
                                    asistentes
                                </p>
                            </div>
                            <div class="self-center text-right">
                                <p class="font-display text-sm font-semibold text-primary">
                                    {{ formatMoney(offering.totalAmount, offering.currency) }}
                                </p>
                                <p class="text-[10px] uppercase text-on-surface-variant">ofrenda</p>
                            </div>
                        </button>
                    </div>
                    <p v-else class="px-8 py-14 text-center text-sm text-on-surface-variant">
                        Aún no hay ofrendas registradas en este período.
                    </p>
                </UiCard>

                <UiCard class="rounded-xl p-6 md:p-8">
                    <div class="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary"
                            >
                                Agenda
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Próximas reuniones
                            </h2>
                        </div>
                        <CalendarDays class="size-5 text-primary" />
                    </div>

                    <div v-if="summary.upcomingMeetings.length" class="space-y-3">
                        <button
                            v-for="meeting in summary.upcomingMeetings"
                            :key="meeting.id"
                            type="button"
                            :class="[
                                'flex w-full gap-4 rounded-lg border border-outline-variant p-4 text-left transition-colors',
                                canViewMeetings
                                    ? 'hover:border-primary hover:bg-surface-container-low'
                                    : 'cursor-default',
                            ]"
                            @click="openMeeting(meeting.id)"
                        >
                            <span
                                class="mt-1 h-11 w-1 flex-none rounded-full"
                                :style="{ backgroundColor: meeting.color }"
                            />
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-semibold text-on-surface">
                                    {{ meeting.title }}
                                </p>
                                <p class="mt-1 text-[11px] text-on-surface-variant">
                                    {{ meeting.typeName }} · {{ meeting.sectorName }}
                                </p>
                                <div
                                    class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant"
                                >
                                    <span class="inline-flex items-center gap-1">
                                        <Clock3 class="size-3" />
                                        {{
                                            formatDate(meeting.occurrenceDate, { weekday: 'short' })
                                        }}
                                        ·
                                        {{ meeting.startTime }}
                                    </span>
                                    <span class="inline-flex items-center gap-1">
                                        <MapPin class="size-3" /> {{ meeting.location }}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                    <p v-else class="py-14 text-center text-sm text-on-surface-variant">
                        No hay reuniones próximas configuradas.
                    </p>
                </UiCard>
            </section>

            <section v-if="hasQuickActions" class="mt-6">
                <UiCard class="rounded-xl p-6 md:px-8">
                    <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p class="font-display text-lg font-semibold text-on-surface">
                                Acciones rápidas
                            </p>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Continúa con las operaciones más frecuentes.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <UiButton
                                v-if="canCreateMembers"
                                variant="outline"
                                type="button"
                                class="rounded"
                                @click="navigateTo('/comunidad/miembros/nuevo')"
                            >
                                <UserPlus class="mr-2 size-4" /> Nuevo miembro
                            </UiButton>
                            <UiButton
                                v-if="canManageMeetings"
                                variant="outline"
                                type="button"
                                class="rounded"
                                @click="navigateTo('/catalogos/reuniones/nueva')"
                            >
                                <CalendarPlus class="mr-2 size-4" /> Nueva reunión
                            </UiButton>
                            <UiButton
                                v-if="canManageFinance"
                                type="button"
                                class="rounded"
                                @click="navigateTo('/finanzas/ofrendas/nueva')"
                            >
                                <CircleDollarSign class="mr-2 size-4" /> Registrar ofrenda
                            </UiButton>
                        </div>
                    </div>
                </UiCard>
            </section>
        </template>
    </main>
</template>
