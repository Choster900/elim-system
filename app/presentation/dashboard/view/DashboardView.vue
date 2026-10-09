<script setup lang="ts">
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CalendarPlus,
    CircleDollarSign,
    Clock3,
    Compass,
    HandCoins,
    MapPin,
    Minus,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    UserPlus,
    UsersRound,
} from '@lucide/vue'
import RankedBarList from '~/presentation/shared/components/charts/RankedBarList.vue'
import TrendChart from '~/presentation/shared/components/charts/TrendChart.vue'
import { useDashboardQuery } from '~/presentation/dashboard/composables/useDashboardQuery'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import type {
    DashboardDateRange,
    DashboardMetric,
    DashboardPeriodDays,
} from '~/presentation/dashboard/interfaces/dashboard.interface'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import AppTour from '~/presentation/shared/components/AppTour.vue'
import TerritoryAssignment from '~/presentation/shared/components/TerritoryAssignment.vue'
import { useTourProgress } from '~/presentation/shared/composables/useTourProgress'
import type { TourStep } from '~/presentation/shared/interfaces/tour.interface'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import { resolveHttpErrorMessage } from '~/utils/http/resolve-http-error-message.util'
import { formatTime12h } from '~/utils/date/date-format.util'

defineOptions({ name: 'DashboardView' })

useHead({ title: 'Dashboard · Sistema' })

const authStore = useAuthStore()
const toast = useAppToast()
const selectedPeriod = ref<DashboardPeriodDays>(30)
const selectedDistrictId = ref<number | null>(null)
const customRange = ref<DatePickerRange>({ start: null, end: null })
const DASHBOARD_MAX_RANGE_DAYS = 731
const isRangeTooLong = computed(() => {
    const { start, end } = customRange.value
    if (!start || !end) return false
    const days = (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1
    return days > DASHBOARD_MAX_RANGE_DAYS
})
const appliedRange = computed<DashboardDateRange | null>(() => {
    const { start, end } = customRange.value
    if (!start || !end || isRangeTooLong.value) return null
    return { startDate: start, endDate: end }
})
const dashboardQuery = useDashboardQuery(selectedPeriod, selectedDistrictId, appliedRange)
const summary = computed(() => dashboardQuery.data.value ?? null)
const isLoading = computed(() => dashboardQuery.isPending.value)
const isRefreshing = computed(() => dashboardQuery.isFetching.value && !isLoading.value)
const isTourOpen = ref(false)
const isClientReady = ref(false)
const { hasSeen, markSeen } = useTourProgress('dashboard', 1)

const tourSteps: TourStep[] = [
    {
        id: 'welcome',
        target: '[data-tour="dashboard-heading"]',
        title: 'Tu panel de control',
        description: 'Aquí tienes una vista general de la actividad reciente de la comunidad.',
    },
    {
        id: 'period',
        target: '[data-tour="dashboard-period"]',
        title: 'Elige el período',
        description:
            'Consulta los últimos 30 o 90 días, los últimos 12 meses o elige un rango de fechas exacto.',
    },
    {
        id: 'district-filter',
        target: '[data-tour="dashboard-district-filter"]',
        title: 'Filtra por distrito',
        description:
            'Si tienes varios distritos, selecciona uno para ver sus reuniones y ofrendas.',
    },
    {
        id: 'metrics',
        target: '[data-tour="dashboard-metrics"]',
        title: 'Indicadores principales',
        description:
            'Revisa ofrendas, asistencia, reuniones y miembros. Los cambios comparan con el período anterior.',
    },
    {
        id: 'attendance',
        target: '[data-tour="dashboard-attendance"]',
        title: 'Tendencia de asistencia',
        description:
            'Sigue la evolución de la asistencia, el promedio por reunión y el cumplimiento frente a lo esperado.',
    },
    {
        id: 'offerings',
        target: '[data-tour="dashboard-offerings"]',
        title: 'Tendencia de ofrendas',
        description:
            'Observa cómo cambia la recaudación, el promedio por reunión y la ofrenda por asistente.',
    },
    {
        id: 'categories',
        target: '[data-tour="dashboard-categories"]',
        title: 'Ofrendas por categoría',
        description:
            'Compara cuánto se recolectó en cada categoría y qué parte del total representa.',
    },
    {
        id: 'districts',
        target: '[data-tour="dashboard-districts"]',
        title: 'Desempeño por distrito',
        description: 'Compara la asistencia, los registros y las ofrendas de cada distrito.',
    },
    {
        id: 'recent',
        target: '[data-tour="dashboard-recent"]',
        title: 'Últimos registros',
        description:
            'Aquí aparecen las reuniones con asistencia y ofrendas registradas recientemente.',
    },
    {
        id: 'upcoming',
        target: '[data-tour="dashboard-upcoming"]',
        title: 'Próximas reuniones',
        description: 'Revisa la agenda con fecha, hora y lugar de las siguientes reuniones.',
    },
    {
        id: 'actions',
        target: '[data-tour="dashboard-actions"]',
        title: 'Acciones rápidas',
        description: 'Inicia las tareas disponibles para tu cuenta desde estos accesos directos.',
    },
]

function startTour() {
    if (!summary.value) return
    isTourOpen.value = true
}

function endTour() {
    isTourOpen.value = false
    if (authStore.user?.id) markSeen(authStore.user.id)
}

function startFirstVisitTour() {
    const userId = authStore.user?.id
    if (isClientReady.value && summary.value && userId && !hasSeen(userId)) startTour()
}

onMounted(() => {
    isClientReady.value = true
    startFirstVisitTour()
})

watch([summary, () => authStore.user?.id], startFirstVisitTour)

const periodOptions: Array<{ value: DashboardPeriodDays; label: string }> = [
    { value: 30, label: '30 días' },
    { value: 90, label: '90 días' },
    { value: 365, label: '12 meses' },
]

const filterLabelClass =
    'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant'

function selectPeriod(period: DashboardPeriodDays) {
    selectedPeriod.value = period
    customRange.value = { start: null, end: null }
}
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
const canRecordFinance = computed(() => authStore.hasPermission('finance.record'))
const canViewFinance = computed(() => authStore.hasPermission('finance.view'))
const hasQuickActions = computed(
    () => canCreateMembers.value || canManageMeetings.value || canRecordFinance.value,
)
const NuxtLinkComponent = resolveComponent('NuxtLink')

const categoryItems = computed(
    () =>
        summary.value?.categoryDistribution.map((category) => ({
            id: category.id,
            label: category.name,
            value: category.value,
            meta: `${formatNumber(category.percentage)}%`,
        })) ?? [],
)

const attendanceGoalWidth = computed(() =>
    Math.min(100, Math.max(0, summary.value?.metrics.attendanceGoalRate ?? 0)),
)

onServerPrefetch(() =>
    dashboardQuery
        .suspense()
        .then(() => undefined)
        .catch(() => undefined),
)

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

function changeDirection(metric: DashboardMetric) {
    if (metric.changePercentage === null || metric.changePercentage === 0) return 'flat'
    return metric.changePercentage > 0 ? 'up' : 'down'
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
            meta: changeLabel(summary.value.metrics.offerings),
            direction: changeDirection(summary.value.metrics.offerings),
            icon: HandCoins,
        },
        {
            label: 'Asistencia registrada',
            value: formatNumber(summary.value.metrics.attendance.value),
            meta: changeLabel(summary.value.metrics.attendance),
            direction: changeDirection(summary.value.metrics.attendance),
            icon: UsersRound,
        },
        {
            label: 'Reuniones documentadas',
            value: formatNumber(summary.value.metrics.registeredMeetings.value),
            meta: changeLabel(summary.value.metrics.registeredMeetings),
            direction: changeDirection(summary.value.metrics.registeredMeetings),
            icon: CalendarDays,
        },
        {
            label: 'Miembros activos',
            value: formatNumber(summary.value.metrics.activeMembers),
            meta: `${formatNumber(summary.value.metrics.newMembers.value)} incorporados en el período`,
            direction: null,
            icon: Activity,
        },
    ]
})

function recentOfferingLink(meetingId: number) {
    return canViewFinance.value ? { to: `/finanzas/ofrendas/reunion/${meetingId}` } : {}
}

function upcomingMeetingLink(id: number) {
    return canManageMeetings.value ? { to: `/catalogos/reuniones/${id}/editar` } : {}
}

const quickActionClass =
    'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
</script>

<template>
    <main class="mx-auto w-full max-w-system px-6 pb-20 pt-24 lg:px-10">
        <header
            data-tour="dashboard-heading"
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
                <TerritoryAssignment :territory="authStore.user?.territoryAssignment" />
            </div>

            <div class="flex items-center gap-3">
                <div class="group relative">
                    <button
                        type="button"
                        class="flex size-10 items-center justify-center rounded-full border border-primary/40 bg-surface text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
                        aria-label="Iniciar recorrido guiado del dashboard"
                        aria-describedby="dashboard-tour-hint"
                        :disabled="!summary"
                        @click="startTour"
                    >
                        <Compass class="size-4" />
                    </button>
                    <div
                        id="dashboard-tour-hint"
                        role="tooltip"
                        class="pointer-events-none absolute right-0 top-full z-50 mt-2 w-60 translate-y-1 rounded-xl border border-outline-variant bg-surface p-3 text-left opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    >
                        <span
                            class="absolute -top-1 right-3 size-2 rotate-45 border-l border-t border-outline-variant bg-surface"
                        />
                        <p class="text-xs font-semibold text-on-surface">Recorrido guiado</p>
                        <p class="mt-1 text-xs leading-5 text-on-surface-variant">
                            Conoce los indicadores, filtros y acciones rápidas del dashboard.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    class="flex size-10 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                    :aria-label="isRefreshing ? 'Actualizando dashboard' : 'Actualizar dashboard'"
                    :aria-busy="isRefreshing"
                    :disabled="dashboardQuery.isFetching.value"
                    @click="dashboardQuery.refetch()"
                >
                    <RefreshCw
                        :class="['size-4', isRefreshing ? 'animate-spin' : '']"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </header>

        <section
            class="mt-6 flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5 lg:flex-row lg:items-end"
            aria-label="Filtros del dashboard"
        >
            <div
                data-tour="dashboard-period"
                class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end lg:flex-1"
            >
                <div class="shrink-0">
                    <span id="dashboard-period-label" :class="filterLabelClass">Período</span>
                    <div
                        role="group"
                        aria-labelledby="dashboard-period-label"
                        class="flex h-11 items-center gap-1 rounded-lg border border-outline-variant bg-surface p-1"
                    >
                        <button
                            v-for="period in periodOptions"
                            :key="period.value"
                            type="button"
                            :class="[
                                'h-full flex-1 whitespace-nowrap rounded-md px-3.5 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-none',
                                !appliedRange && selectedPeriod === period.value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-on-surface-variant hover:bg-surface-container',
                            ]"
                            :aria-pressed="!appliedRange && selectedPeriod === period.value"
                            @click="selectPeriod(period.value)"
                        >
                            {{ period.label }}
                        </button>
                    </div>
                </div>
                <div class="relative min-w-0 flex-1">
                    <span :class="filterLabelClass">Rango personalizado</span>
                    <UiDatePicker
                        v-model="customRange"
                        mode="range"
                        placeholder="Elige fecha inicial y final"
                        :invalid="isRangeTooLong"
                    />
                    <p
                        v-if="isRangeTooLong"
                        class="mt-1 text-[11px] text-destructive lg:absolute lg:top-full"
                    >
                        El rango no puede superar {{ DASHBOARD_MAX_RANGE_DAYS }} días.
                    </p>
                </div>
            </div>
            <div
                v-if="districtOptions.length > 1"
                data-tour="dashboard-district-filter"
                class="min-w-0 lg:w-72 lg:flex-none"
            >
                <span :class="filterLabelClass">Distrito</span>
                <UiSearchSelect
                    v-model="selectedDistrictId"
                    :options="districtOptions"
                    clearable
                    placeholder="Todos los distritos"
                    search-placeholder="Buscar distrito..."
                    aria-label="Distrito"
                />
            </div>
        </section>

        <p
            v-if="summary"
            class="mt-3 flex items-start gap-2 text-xs text-on-surface-variant"
            aria-live="polite"
        >
            <CalendarDays class="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
                Mostrando del
                <strong class="text-on-surface">
                    {{ formatDate(summary.period.startDate, { year: 'numeric' }) }}
                </strong>
                al
                <strong class="text-on-surface">
                    {{ formatDate(summary.period.endDate, { year: 'numeric' }) }}
                </strong>
                ({{ summary.period.days }} días). Los cambios se comparan con el
                {{ formatDate(summary.period.previousStartDate) }} –
                {{ formatDate(summary.period.previousEndDate, { year: 'numeric' }) }}.
            </span>
        </p>

        <section
            v-if="isLoading"
            class="mt-8 space-y-6"
            aria-label="Cargando dashboard"
            aria-busy="true"
        >
            <span class="sr-only">Cargando indicadores…</span>
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
            <section
                data-tour="dashboard-metrics"
                aria-labelledby="dashboard-metrics-title"
                class="mt-8"
            >
                <h2 id="dashboard-metrics-title" class="sr-only">Indicadores principales</h2>
                <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <UiCard
                        v-for="card in metricCards"
                        :key="card.label"
                        class="rounded-xl p-6 transition-colors hover:border-primary/60"
                    >
                        <div
                            class="flex size-11 items-center justify-center rounded-lg bg-primary/10"
                            aria-hidden="true"
                        >
                            <component :is="card.icon" class="size-5 text-primary" />
                        </div>
                        <dt
                            class="mt-5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                        >
                            {{ card.label }}
                        </dt>
                        <dd class="mt-1 font-sans text-3xl font-semibold text-on-surface">
                            {{ card.value }}
                        </dd>
                        <dd
                            class="mt-2 flex items-start gap-1.5 text-xs leading-5"
                            :class="{
                                'text-primary': card.direction === 'up',
                                'text-destructive': card.direction === 'down',
                                'text-on-surface-variant':
                                    card.direction === 'flat' || card.direction === null,
                            }"
                        >
                            <TrendingUp
                                v-if="card.direction === 'up'"
                                class="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <TrendingDown
                                v-else-if="card.direction === 'down'"
                                class="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <Minus
                                v-else-if="card.direction === 'flat'"
                                class="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span>{{ card.meta }}</span>
                        </dd>
                    </UiCard>
                </dl>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-2">
                <UiCard data-tour="dashboard-attendance" class="rounded-xl p-6 md:p-8">
                    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                            >
                                Participación
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Tendencia de asistencia
                            </h2>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Personas registradas en cada fecha de reunión.
                            </p>
                        </div>
                        <dl class="flex gap-6 sm:text-right">
                            <div>
                                <dt class="text-xs text-on-surface-variant">
                                    Promedio por reunión
                                </dt>
                                <dd class="text-xl font-semibold text-on-surface">
                                    {{ formatNumber(summary.metrics.averageAttendance) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-xs text-on-surface-variant">Cumplimiento</dt>
                                <dd class="text-xl font-semibold text-on-surface">
                                    {{ formatNumber(summary.metrics.attendanceGoalRate) }}%
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div class="mt-4">
                        <div
                            class="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
                            role="meter"
                            aria-label="Asistencia frente a la esperada"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            :aria-valuenow="attendanceGoalWidth"
                            :aria-valuetext="`${formatNumber(summary.metrics.attendanceGoalRate)}% de la asistencia esperada`"
                        >
                            <div
                                class="h-full rounded-full bg-primary"
                                :style="{ width: `${attendanceGoalWidth}%` }"
                            />
                        </div>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            Asistencia frente a la esperada en las reuniones
                        </p>
                    </div>
                    <TrendChart
                        class="mt-5"
                        :values="attendanceTrend"
                        label="Asistencia por período"
                        color="var(--chart-1)"
                    />
                </UiCard>

                <UiCard data-tour="dashboard-offerings" class="rounded-xl p-6 md:p-8">
                    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
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
                        <dl class="flex gap-6 sm:text-right">
                            <div>
                                <dt class="text-xs text-on-surface-variant">
                                    Promedio por reunión
                                </dt>
                                <dd class="text-xl font-semibold text-on-surface">
                                    {{ formatCompactMoney(summary.metrics.averageOffering) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-xs text-on-surface-variant">Por asistente</dt>
                                <dd class="text-xl font-semibold text-on-surface">
                                    {{ formatMoney(summary.metrics.offeringPerAttendee) }}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <TrendChart
                        class="mt-6"
                        :values="offeringTrend"
                        label="Ofrendas por período"
                        color="var(--chart-2)"
                        format="currency"
                    />
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-2">
                <UiCard data-tour="dashboard-categories" class="rounded-xl p-6 md:p-8">
                    <div class="mb-6">
                        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Composición
                        </p>
                        <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                            Ofrendas por categoría
                        </h2>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            Monto recolectado y porcentaje del total.
                        </p>
                    </div>
                    <RankedBarList
                        :items="categoryItems"
                        label="Ofrendas por categoría"
                        format="currency"
                        empty-message="Aún no hay categorías registradas en este período."
                        :limit="6"
                    />
                </UiCard>

                <UiCard data-tour="dashboard-districts" class="rounded-xl p-6 md:p-8">
                    <div class="mb-6">
                        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Territorio
                        </p>
                        <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                            Desempeño por distrito
                        </h2>
                        <p class="mt-1 text-xs text-on-surface-variant">
                            Ofrendas de cada distrito, con su asistencia y registros.
                        </p>
                    </div>

                    <ul v-if="summary.districtPerformance.length" class="space-y-5">
                        <li
                            v-for="district in summary.districtPerformance"
                            :key="district.id"
                            class="space-y-2"
                        >
                            <div class="flex items-end justify-between gap-4">
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-semibold text-on-surface">
                                        {{ district.name }}
                                    </p>
                                    <p class="mt-0.5 text-xs text-on-surface-variant">
                                        {{ formatNumber(district.attendance) }} asistentes ·
                                        {{ district.meetingCount }} registros
                                    </p>
                                </div>
                                <p class="text-sm font-semibold tabular-nums text-on-surface">
                                    {{ formatCompactMoney(district.offerings) }}
                                </p>
                            </div>
                            <div
                                class="h-2 overflow-hidden rounded-full bg-surface-container-highest"
                                aria-hidden="true"
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
                        </li>
                    </ul>
                    <p v-else class="py-12 text-center text-sm text-on-surface-variant">
                        No hay registros territoriales en este período.
                    </p>
                </UiCard>
            </section>

            <section class="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <UiCard data-tour="dashboard-recent" class="overflow-hidden rounded-xl">
                    <div
                        class="flex items-end justify-between gap-4 border-b border-outline-variant p-6 md:px-8"
                    >
                        <div>
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                            >
                                Últimos registros
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Asistencia y ofrendas
                            </h2>
                        </div>
                        <NuxtLink
                            v-if="canViewFinance"
                            to="/finanzas/ofrendas/historial"
                            class="flex items-center gap-1 rounded text-xs font-semibold uppercase tracking-wider text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Ver historial <ArrowRight class="size-3.5" aria-hidden="true" />
                        </NuxtLink>
                    </div>

                    <ul
                        v-if="summary.recentOfferings.length"
                        class="divide-y divide-outline-variant"
                    >
                        <li v-for="offering in summary.recentOfferings" :key="offering.id">
                            <component
                                :is="canViewFinance ? NuxtLinkComponent : 'div'"
                                v-bind="recentOfferingLink(offering.meetingId)"
                                :class="[
                                    'grid w-full grid-cols-[1fr_auto] gap-4 px-6 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_120px_130px] md:px-8',
                                    canViewFinance
                                        ? 'hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
                                        : '',
                                ]"
                            >
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-semibold text-on-surface">
                                        {{ offering.meetingTitle }}
                                    </p>
                                    <p class="mt-1 truncate text-xs text-on-surface-variant">
                                        {{ offering.districtName }} ·
                                        {{ formatDate(offering.date) }}
                                    </p>
                                </div>
                                <div class="hidden self-center text-right md:block">
                                    <p class="text-sm font-semibold text-on-surface">
                                        {{ offering.attendance }}
                                    </p>
                                    <p class="text-xs text-on-surface-variant">asistentes</p>
                                </div>
                                <div class="self-center text-right">
                                    <p class="text-sm font-semibold text-on-surface">
                                        {{ formatMoney(offering.totalAmount, offering.currency) }}
                                    </p>
                                    <p class="text-xs text-on-surface-variant">ofrenda</p>
                                </div>
                            </component>
                        </li>
                    </ul>
                    <p v-else class="px-8 py-14 text-center text-sm text-on-surface-variant">
                        Aún no hay ofrendas registradas en este período.
                    </p>
                </UiCard>

                <UiCard data-tour="dashboard-upcoming" class="rounded-xl p-6 md:p-8">
                    <div class="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                            >
                                Agenda
                            </p>
                            <h2 class="mt-2 font-display text-2xl font-semibold text-on-surface">
                                Próximas reuniones
                            </h2>
                        </div>
                        <CalendarDays class="size-5 text-primary" aria-hidden="true" />
                    </div>

                    <ul v-if="summary.upcomingMeetings.length" class="space-y-3">
                        <li v-for="meeting in summary.upcomingMeetings" :key="meeting.id">
                            <component
                                :is="canManageMeetings ? NuxtLinkComponent : 'div'"
                                v-bind="upcomingMeetingLink(meeting.id)"
                                :class="[
                                    'flex w-full gap-4 rounded-lg border border-outline-variant p-4 text-left transition-colors',
                                    canManageMeetings
                                        ? 'hover:border-primary hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                        : '',
                                ]"
                            >
                                <span
                                    class="mt-1 h-11 w-1 flex-none rounded-full"
                                    :style="{ backgroundColor: meeting.color }"
                                    aria-hidden="true"
                                />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-on-surface">
                                        {{ meeting.title }}
                                    </p>
                                    <p class="mt-1 text-xs text-on-surface-variant">
                                        {{ meeting.typeName }} · {{ meeting.sectorName }}
                                    </p>
                                    <div
                                        class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant"
                                    >
                                        <span class="inline-flex items-center gap-1">
                                            <Clock3 class="size-3" aria-hidden="true" />
                                            <span class="capitalize">
                                                {{
                                                    formatDate(meeting.occurrenceDate, {
                                                        weekday: 'short',
                                                    })
                                                }}
                                            </span>
                                            · {{ formatTime12h(meeting.startTime) }}
                                        </span>
                                        <span class="inline-flex items-center gap-1">
                                            <MapPin class="size-3" aria-hidden="true" />
                                            {{ meeting.location }}
                                        </span>
                                    </div>
                                </div>
                            </component>
                        </li>
                    </ul>
                    <p v-else class="py-14 text-center text-sm text-on-surface-variant">
                        No hay reuniones próximas configuradas.
                    </p>
                </UiCard>
            </section>

            <section v-if="hasQuickActions" data-tour="dashboard-actions" class="mt-6">
                <UiCard class="rounded-xl p-6 md:px-8">
                    <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 class="font-display text-lg font-semibold text-on-surface">
                                Acciones rápidas
                            </h2>
                            <p class="mt-1 text-xs text-on-surface-variant">
                                Continúa con las operaciones más frecuentes.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <NuxtLink
                                v-if="canCreateMembers"
                                to="/comunidad/miembros/nuevo"
                                :class="[
                                    quickActionClass,
                                    'border-outline-variant bg-surface text-on-surface hover:border-primary',
                                ]"
                            >
                                <UserPlus class="size-4" aria-hidden="true" /> Nuevo miembro
                            </NuxtLink>
                            <NuxtLink
                                v-if="canManageMeetings"
                                to="/catalogos/reuniones/nueva"
                                :class="[
                                    quickActionClass,
                                    'border-outline-variant bg-surface text-on-surface hover:border-primary',
                                ]"
                            >
                                <CalendarPlus class="size-4" aria-hidden="true" /> Nueva reunión
                            </NuxtLink>
                            <NuxtLink
                                v-if="canRecordFinance"
                                to="/finanzas/ofrendas"
                                :class="[
                                    quickActionClass,
                                    'border-primary bg-primary text-primary-foreground hover:opacity-90',
                                ]"
                            >
                                <CircleDollarSign class="size-4" aria-hidden="true" /> Registrar
                                ofrendas
                            </NuxtLink>
                        </div>
                    </div>
                </UiCard>
            </section>
        </template>
        <AppTour :open="isTourOpen" :steps="tourSteps" @close="endTour" @complete="endTour" />
    </main>
</template>
