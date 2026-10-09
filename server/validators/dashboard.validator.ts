import Joi from 'joi'
import type { DashboardQueryDto } from '../dto/dashboard/dashboard.dto'

export const DASHBOARD_MAX_RANGE_DAYS = 731

const isoDay = Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value: string, helpers) => {
        const parsed = new Date(`${value}T00:00:00Z`)
        const isRealDate =
            !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
        return isRealDate ? value : helpers.error('string.realDate')
    })
    .messages({
        'string.pattern.base': 'Usa el formato AAAA-MM-DD.',
        'string.realDate': 'La fecha no existe en el calendario.',
    })

export const dashboardQuerySchema = Joi.object<DashboardQueryDto>({
    periodDays: Joi.number().integer().valid(30, 90, 365).default(30),
    districtId: Joi.number().integer().positive(),
    startDate: isoDay,
    endDate: isoDay,
})
    .and('startDate', 'endDate')
    .custom((value: DashboardQueryDto, helpers) => {
        if (!value.startDate || !value.endDate) return value
        if (value.endDate < value.startDate) return helpers.error('dashboard.rangeOrder')

        const days =
            (Date.parse(`${value.endDate}T00:00:00Z`) -
                Date.parse(`${value.startDate}T00:00:00Z`)) /
                86_400_000 +
            1
        if (days > DASHBOARD_MAX_RANGE_DAYS) return helpers.error('dashboard.rangeLength')
        return value
    })
    .messages({
        'object.and': 'Indica la fecha inicial y la final del rango.',
        'dashboard.rangeOrder': 'La fecha final no puede ser anterior a la inicial.',
        'dashboard.rangeLength': `El rango no puede superar ${DASHBOARD_MAX_RANGE_DAYS} días.`,
    })
