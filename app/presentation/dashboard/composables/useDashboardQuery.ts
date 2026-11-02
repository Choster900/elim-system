import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type {
    DashboardDateRange,
    DashboardKind,
    DashboardPeriodDays,
} from '../interfaces/dashboard.interface'
import { getDashboardSummary } from '../services/dashboard.service'

export function useDashboardQuery(
    periodDays: MaybeRefOrGetter<DashboardPeriodDays>,
    districtId: MaybeRefOrGetter<number | null>,
    dateRange: MaybeRefOrGetter<DashboardDateRange | null> = null,
    kind: MaybeRefOrGetter<DashboardKind> = 'reuniones',
) {
    const apiClient = useApiClient()
    const resolvedPeriod = computed(() => toValue(periodDays))
    const resolvedDistrict = computed(() => toValue(districtId))
    const resolvedRange = computed(() => toValue(dateRange))
    const resolvedKind = computed(() => toValue(kind))

    return useQuery({
        queryKey: computed(() =>
            queryKeys.dashboard.summary(
                resolvedKind.value,
                resolvedPeriod.value,
                resolvedDistrict.value,
                resolvedRange.value?.startDate ?? null,
                resolvedRange.value?.endDate ?? null,
            ),
        ),
        queryFn: ({ signal }) =>
            getDashboardSummary(
                apiClient,
                resolvedPeriod.value,
                resolvedDistrict.value,
                resolvedRange.value,
                signal,
                resolvedKind.value,
            ),
    })
}
