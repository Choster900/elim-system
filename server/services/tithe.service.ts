import { createError } from 'h3'
import type { SaveTitheDto, TitheFiltersDto } from '../dto/tithe/tithe.dto'
import * as repo from '../repositories/tithe.repository'
import { ApiErrorCode } from '../types/api-response.types'
import { businessIsoDate } from '../utils/date/business-time.util'

function businessRule(message: string): never {
    throw createError({
        statusCode: 409,
        message,
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

function notFound(message: string): never {
    throw createError({
        statusCode: 404,
        message,
        data: { code: ApiErrorCode.RESOURCE_NOT_FOUND },
    })
}

function toCents(value: number) {
    return Math.round(value * 100)
}

async function assertSavable(dto: SaveTitheDto, currentMemberId: number | null = null) {
    if (dto.date.slice(0, 10) > businessIsoDate()) {
        businessRule('No puedes registrar un diezmo con fecha futura')
    }
    const member = await repo.findMemberForTithe(dto.memberId)
    if (!member) notFound('El miembro seleccionado no existe')
    if (member.id === currentMemberId) return
    if (member.status === 'DECEASED') {
        businessRule('No puedes registrar un diezmo a nombre de un miembro fallecido')
    }
    if (!member.isTither) {
        businessRule('El miembro seleccionado no tiene el rol de diezmador')
    }
}

export function getTithers() {
    return repo.findTithers()
}

export async function getTithes(filters: TitheFiltersDto) {
    if (filters.from && filters.to && filters.from.slice(0, 10) > filters.to.slice(0, 10)) {
        businessRule('La fecha inicial no puede ser posterior a la final')
    }
    const items = await repo.findTithes(filters)
    const totalCents = items.reduce((sum, tithe) => sum + toCents(tithe.amount), 0)
    return {
        items,
        summary: {
            count: items.length,
            members: new Set(items.map((tithe) => tithe.member.id)).size,
            total: totalCents / 100,
        },
    }
}

export async function createTithe(dto: SaveTitheDto, userId: number) {
    await assertSavable(dto)
    return repo.createTithe(dto, userId)
}

export async function updateTithe(id: number, dto: SaveTitheDto, userId: number) {
    const existing = await repo.findTitheById(id)
    if (!existing) notFound('El diezmo no existe')
    await assertSavable(dto, existing.member.id)
    return repo.updateTithe(id, dto, userId)
}

export async function deleteTithe(id: number) {
    const existing = await repo.findTitheById(id)
    if (!existing) notFound('El diezmo no existe')
    await repo.deleteTithe(id)
    return existing
}
