import { prisma } from '../database/prisma'
import type {
    CreateAttendanceTypeDto,
    UpdateAttendanceTypeDto,
} from '../dto/attendance/attendance.dto'
import { mapPrismaError } from '../utils/database/prisma-error.util'

export function findAttendanceTypes() {
    return prisma.attendanceType.findMany({
        include: { group: true },
        orderBy: [
            { isActive: 'desc' },
            { group: { sortOrder: 'asc' } },
            { sortOrder: 'asc' },
            { name: 'asc' },
        ],
    })
}

export function findAttendanceTypeById(id: number) {
    return prisma.attendanceType.findUnique({ where: { id } })
}

export function findAttendanceTypeCounting(ids: number[]) {
    return prisma.attendanceType
        .findMany({
            where: { id: { in: ids } },
            select: { id: true, group: { select: { countsTowardAttendance: true } } },
        })
        .then((rows) =>
            rows.map((row) => ({
                id: row.id,
                countsTowardAttendance: row.group?.countsTowardAttendance ?? true,
            })),
        )
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

export function countAttendanceDetailsByType(typeId: number) {
    return prisma.attendanceDetail.count({ where: { typeId } })
}
