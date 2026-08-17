import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { DashboardPeriodDays } from '../interfaces/dashboard.interface'
import { getDashboardSummary } from '../services/dashboard.service'

export function useDashboardQuery(
    periodDays: MaybeRefOrGetter<DashboardPeriodDays>,
    districtId: MaybeRefOrGetter<number | null>,
) {
    const apiClient = useApiClient()
    const resolvedPeriod = computed(() => toValue(periodDays))
    const resolvedDistrict = computed(() => toValue(districtId))

    return useQuery({
        queryKey: computed(() =>
            queryKeys.dashboard.summary(resolvedPeriod.value, resolvedDistrict.value),
        ),
        queryFn: ({ signal }) =>
            getDashboardSummary(apiClient, resolvedPeriod.value, resolvedDistrict.value, signal),
    })
}
