import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { DashboardDateRange, DashboardPeriodDays } from '../interfaces/dashboard.interface'
import { getDashboardSummary } from '../services/dashboard.service'

export function useDashboardQuery(
    periodDays: MaybeRefOrGetter<DashboardPeriodDays>,
    districtId: MaybeRefOrGetter<number | null>,
    dateRange: MaybeRefOrGetter<DashboardDateRange | null> = null,
) {
    const apiClient = useApiClient()
    const resolvedPeriod = computed(() => toValue(periodDays))
    const resolvedDistrict = computed(() => toValue(districtId))
    const resolvedRange = computed(() => toValue(dateRange))

    return useQuery({
        queryKey: computed(() =>
            queryKeys.dashboard.summary(
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
            ),
    })
}
