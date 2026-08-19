import { prisma } from '../database/prisma'
import type {
    CreateAttendanceTypeDto,
    UpdateAttendanceTypeDto,
} from '../dto/attendance/attendance.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

export function findAttendanceTypes() {
    return prisma.attendanceType.findMany({
        orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
}

export function findAttendanceTypeById(id: number) {
    return prisma.attendanceType.findUnique({ where: { id } })
}

export function findAttendanceTypeIdsByIds(ids: number[]) {
    return prisma.attendanceType
        .findMany({ where: { id: { in: ids } }, select: { id: true } })
        .then((rows) => rows.map((row) => row.id))
}

export function createAttendanceType(dto: CreateAttendanceTypeDto) {
    return prisma.attendanceType.create({ data: dto }).catch(mapPrismaError)
}

export function updateAttendanceType(id: number, dto: UpdateAttendanceTypeDto) {
    return prisma.attendanceType.update({ where: { id }, data: dto }).catch(mapPrismaError)
}

export function deleteAttendanceType(id: number) {
    return prisma.attendanceType.delete({ where: { id } }).catch(mapPrismaError)
}

/// Cuántas fechas ya usan este tipo: un tipo con historial no se puede borrar.
export function countAttendanceDetailsByType(typeId: number) {
    return prisma.attendanceDetail.count({ where: { typeId } })
}
