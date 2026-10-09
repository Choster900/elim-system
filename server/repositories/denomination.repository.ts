import type { Denomination } from '@prisma/client'
import { prisma } from '../database/prisma'

export function toDenominationRecord(denomination: Denomination) {
    return {
        id: denomination.id,
        code: denomination.code,
        name: denomination.name,
        value: Number(denomination.value),
        kind: denomination.kind === 'BILL' ? ('billete' as const) : ('moneda' as const),
        sortOrder: denomination.sortOrder,
        isActive: denomination.isActive,
    }
}

export type DenominationRecord = ReturnType<typeof toDenominationRecord>

export function findActiveDenominations() {
    return prisma.denomination
        .findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })
        .then((rows) => rows.map(toDenominationRecord))
}

export function findDenominationsByIds(ids: number[]) {
    return prisma.denomination
        .findMany({ where: { id: { in: ids } } })
        .then((rows) => rows.map(toDenominationRecord))
}
