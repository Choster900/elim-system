import type { AxiosInstance } from 'axios'
import type { ApiResponse } from '~/presentation/shared/interfaces/api-response.interface'
import type { Member, MemberImportResult, MemberInput } from '../interfaces/member.interface'

export async function getMembers(apiClient: AxiosInstance) {
    const members: Member[] = []
    let page = 1
    let totalPages = 1

    do {
        const response = await apiClient.get<ApiResponse<Member[]>>('/members', {
            params: { page, limit: 100 },
        })
        members.push(...(response.data.data ?? []))
        totalPages = response.data.meta?.pagination?.totalPages ?? 1
        page += 1
    } while (page <= totalPages)

    return members
}

export async function createMember(apiClient: AxiosInstance, payload: MemberInput) {
    const response = await apiClient.post<ApiResponse<Member>>('/members', payload)
    return response.data.data
}

export async function updateMember(
    apiClient: AxiosInstance,
    id: number,
    payload: Partial<MemberInput>,
) {
    const response = await apiClient.put<ApiResponse<Member>>(`/members/${id}`, payload)
    return response.data.data
}

export async function deleteMember(apiClient: AxiosInstance, id: number) {
    await apiClient.delete(`/members/${id}`)
}

export async function importMembers(apiClient: AxiosInstance, members: MemberInput[]) {
    const response = await apiClient.post<ApiResponse<MemberImportResult>>('/members/import', {
        members,
    })
    return response.data.data
}
