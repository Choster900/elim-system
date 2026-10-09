import type { LocationQueryRaw } from 'vue-router'
import type { DatePickerRange } from '~/components/ui/DatePicker.vue'
import type { ReconciliationFilters } from '../interfaces/reconciliation.interface'
import {
    DEFAULT_PERIOD,
    isPeriodPreset,
    resolvePeriod,
    type PeriodPresetKey,
} from '../utils/period-presets.util'

const SHARED_KEYS = ['periodo', 'desde', 'hasta', 'zona'] as const

function queryString(value: unknown) {
    return typeof value === 'string' && value ? value : null
}

export function useReconciliationFilters() {
    const route = useRoute()
    const router = useRouter()

    const period = computed<PeriodPresetKey>(() => {
        const value = route.query.periodo
        if (isPeriodPreset(value)) return value
        return route.query.desde || route.query.hasta ? 'personalizado' : DEFAULT_PERIOD
    })

    const range = computed(() => {
        if (period.value !== 'personalizado') return resolvePeriod(period.value)
        const fallback = resolvePeriod(DEFAULT_PERIOD)
        return {
            from: queryString(route.query.desde) ?? fallback.from,
            to: queryString(route.query.hasta) ?? fallback.to,
        }
    })

    const zoneId = computed(() => {
        const value = Number(route.query.zona)
        return Number.isSafeInteger(value) && value > 0 ? value : null
    })

    const filters = computed<ReconciliationFilters>(() => ({
        from: range.value.from,
        to: range.value.to,
        ...(zoneId.value ? { zoneId: zoneId.value } : {}),
    }))

    function updateQuery(changes: LocationQueryRaw) {
        router.replace({ query: { ...route.query, ...changes } })
    }

    const selectedPeriod = computed<PeriodPresetKey>({
        get: () => period.value,
        set: (value) => {
            if (value === 'personalizado') {
                updateQuery({
                    periodo: 'personalizado',
                    desde: range.value.from,
                    hasta: range.value.to,
                })
                return
            }
            updateQuery({
                periodo: value === DEFAULT_PERIOD ? undefined : value,
                desde: undefined,
                hasta: undefined,
            })
        },
    })

    const dateRange = computed<DatePickerRange>({
        get: () => ({ start: range.value.from, end: range.value.to }),
        set: (value) =>
            updateQuery({
                periodo: 'personalizado',
                desde: value.start ?? undefined,
                hasta: value.end ?? undefined,
            }),
    })

    const selectedZone = computed<number | null>({
        get: () => zoneId.value,
        set: (value) => updateQuery({ zona: value ? String(value) : undefined }),
    })

    const sharedQuery = computed(
        () =>
            Object.fromEntries(
                SHARED_KEYS.map((key) => [key, queryString(route.query[key])]).filter(
                    ([, value]) => value !== null,
                ),
            ) as Record<string, string>,
    )

    function linkTo(path: string, extra: Record<string, string | undefined> = {}) {
        return { path, query: { ...sharedQuery.value, ...extra } }
    }

    return { filters, selectedPeriod, dateRange, selectedZone, updateQuery, linkTo }
}
