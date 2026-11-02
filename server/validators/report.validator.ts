import Joi from 'joi'
import type { MeetingReportQueryDto } from '../dto/report/meeting-report.dto'

export const MEETING_REPORT_MAX_RANGE_DAYS = 366

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

export const meetingReportQuerySchema = Joi.object<MeetingReportQueryDto>({
    from: isoDay.required().messages({ 'any.required': 'Indica la fecha inicial del reporte.' }),
    to: isoDay.required().messages({ 'any.required': 'Indica la fecha final del reporte.' }),
})
    .custom((value: MeetingReportQueryDto, helpers) => {
        if (value.to < value.from) return helpers.error('report.rangeOrder')

        const days =
            (Date.parse(`${value.to}T00:00:00Z`) - Date.parse(`${value.from}T00:00:00Z`)) /
                86_400_000 +
            1
        if (days > MEETING_REPORT_MAX_RANGE_DAYS) return helpers.error('report.rangeLength')
        return value
    })
    .messages({
        'report.rangeOrder': 'La fecha final no puede ser anterior a la inicial.',
        'report.rangeLength': `El rango no puede superar ${MEETING_REPORT_MAX_RANGE_DAYS} días.`,
    })
