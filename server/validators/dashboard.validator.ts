import Joi from 'joi'
import type { DashboardQueryDto } from '../dto/dashboard/dashboard.dto'

export const dashboardQuerySchema = Joi.object<DashboardQueryDto>({
    periodDays: Joi.number().integer().valid(30, 90, 365).default(30),
    districtId: Joi.number().integer().positive(),
})
