import type { MemberStatus } from '~/presentation/members/interfaces/member.interface'

export interface TitheMember {
    id: number
    code: string
    fullName: string
    documentNumber: string | null
    status: MemberStatus
    sectorName: string | null
    zoneName: string | null
}

export interface TitheRecord {
    id: number
    member: TitheMember
    amount: number
    date: string
    notes: string | null
    receivedById: number | null
    receivedByName: string | null
    receivedAt: string
    updatedByName: string | null
    updatedAt: string
}

export interface TitheSummary {
    count: number
    members: number
    total: number
}

export interface TitheList {
    items: TitheRecord[]
    summary: TitheSummary
}

export interface SaveTitheInput {
    memberId: number
    amount: number
    date: string
    notes: string | null
}
