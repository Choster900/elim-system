import type { AttendanceDetail, AttendanceTypeOption } from '../interfaces/occurrence.interface'

export interface AttendanceColumnGroup {
    key: string
    name: string
    countsTowardAttendance: boolean
    types: AttendanceTypeOption[]
}

const UNGROUPED_KEY = 'sin-grupo'
const UNGROUPED_NAME = 'Otros'

export function groupAttendanceTypes(types: AttendanceTypeOption[]) {
    const groups = new Map<string, AttendanceColumnGroup & { sortOrder: number }>()
    for (const type of types) {
        const key = type.group ? String(type.group.id) : UNGROUPED_KEY
        const group = groups.get(key) ?? {
            key,
            name: type.group?.name ?? UNGROUPED_NAME,
            countsTowardAttendance: type.group?.countsTowardAttendance ?? true,
            sortOrder: type.group?.sortOrder ?? Number.MAX_SAFE_INTEGER,
            types: [],
        }
        group.types.push(type)
        groups.set(key, group)
    }
    const ordered = [...groups.values()].sort((left, right) => left.sortOrder - right.sortOrder)
    return {
        attendance: ordered.filter((group) => group.countsTowardAttendance),
        results: ordered.filter((group) => !group.countsTowardAttendance),
    }
}

export function attendanceDetailLabel(detail: Pick<AttendanceDetail, 'groupName' | 'typeName'>) {
    const typeName = detail.typeName ?? 'Sin tipo'
    return detail.groupName ? `${detail.groupName} · ${typeName}` : typeName
}

export function sumAttendanceDetails(details: AttendanceDetail[], countsTowardAttendance: boolean) {
    const totals = new Map<number, { id: number; label: string; value: number }>()
    for (const detail of details) {
        if (detail.countsTowardAttendance !== countsTowardAttendance) continue
        const current = totals.get(detail.typeId) ?? {
            id: detail.typeId,
            label: countsTowardAttendance
                ? attendanceDetailLabel(detail)
                : (detail.typeName ?? 'Sin tipo'),
            value: 0,
        }
        current.value += detail.quantity
        totals.set(detail.typeId, current)
    }
    return [...totals.values()]
}
