import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { queryKeys } from '~/constants/query-keys'
import { useApiClient } from '~/presentation/shared/composables/useApiClient'
import type { ReportDateRange } from '../interfaces/meeting-report.interface'
import { getMeetingReport } from '../services/meeting-report.service'

export function useMeetingReportQuery(range: MaybeRefOrGetter<ReportDateRange | null>) {
    const apiClient = useApiClient()
    const resolvedRange = computed(() => toValue(range))

    return useQuery({
        queryKey: computed(() =>
            queryKeys.reports.meetings(
                resolvedRange.value?.from ?? null,
                resolvedRange.value?.to ?? null,
            ),
        ),
        queryFn: ({ signal }) => getMeetingReport(apiClient, resolvedRange.value!, signal),
        enabled: computed(() => resolvedRange.value !== null),
        placeholderData: keepPreviousData,
    })
}
