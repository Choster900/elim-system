import Joi from 'joi'
import type {
    CreateMeetingDto,
    CreateMeetingTypeDto,
    UpdateMeetingDto,
    UpdateMeetingTypeDto,
} from '../dto/meeting/meeting.dto'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const baseFields = {
    typeId: Joi.number().integer().positive(),
    sectorId: Joi.number().integer().positive(),
    leaderId: Joi.number().integer().positive(),
    supervisorId: Joi.number().integer().positive(),
    coSupervisorIds: Joi.array().items(Joi.number().integer().positive()).default([]),
    title: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(300).allow('', null),
    date: Joi.string().isoDate(),
    recurrenceEndDate: Joi.string().isoDate().allow(null),
    startTime: Joi.string().pattern(timePattern),
    endTime: Joi.string().pattern(timePattern),
    location: Joi.string().trim().min(2).max(300),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),
    frequency: Joi.string().valid('unica', 'diaria', 'semanal', 'quincenal', 'mensual'),
    monthlyMode: Joi.string().valid('dia_fijo', 'ordinal').allow(null),
    weekOrdinal: Joi.number().integer().min(1).max(5).allow(null),
    weekday: Joi.number().integer().min(0).max(6).allow(null),
    expectedAttendees: Joi.number().integer().min(0).max(1000000),
    isActive: Joi.boolean(),
    isPublic: Joi.boolean(),
    notes: Joi.string().trim().max(600).allow('', null),
    color: Joi.string()
        .trim()
        .pattern(/^#[0-9a-f]{6}$/i),
}

const requiredBaseFields = {
    typeId: baseFields.typeId.required(),
    sectorId: baseFields.sectorId.required(),
    leaderId: baseFields.leaderId.required(),
    supervisorId: baseFields.supervisorId.required(),
    coSupervisorIds: baseFields.coSupervisorIds,
    title: baseFields.title.required(),
    description: baseFields.description.default(null),
    date: baseFields.date.required(),
    recurrenceEndDate: baseFields.recurrenceEndDate.default(null),
    startTime: baseFields.startTime.required(),
    endTime: baseFields.endTime.required(),
    location: baseFields.location.required(),
    latitude: baseFields.latitude.default(null),
    longitude: baseFields.longitude.default(null),
    frequency: baseFields.frequency.default('unica'),
    monthlyMode: baseFields.monthlyMode.default(null),
    weekOrdinal: baseFields.weekOrdinal.default(null),
    weekday: baseFields.weekday.default(null),
    expectedAttendees: baseFields.expectedAttendees.default(0),
    isActive: baseFields.isActive.default(true),
    isPublic: baseFields.isPublic.default(false),
    notes: baseFields.notes.default(null),
    color: baseFields.color.required(),
}

export const createMeetingSchema = Joi.object<CreateMeetingDto>(requiredBaseFields)

export const updateMeetingSchema = Joi.object<UpdateMeetingDto>(baseFields).min(1)

const meetingTypeBaseFields = {
    code: Joi.string().trim().uppercase().min(1).max(100),
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(300).allow('', null),
    color: Joi.string()
        .trim()
        .pattern(/^#[0-9a-f]{6}$/i),
    isActive: Joi.boolean(),
}

export const createMeetingTypeSchema = Joi.object<CreateMeetingTypeDto>({
    code: meetingTypeBaseFields.code.required(),
    name: meetingTypeBaseFields.name.required(),
    description: meetingTypeBaseFields.description.default(null),
    color: meetingTypeBaseFields.color.required(),
    isActive: meetingTypeBaseFields.isActive.default(true),
})

export const updateMeetingTypeSchema =
    Joi.object<UpdateMeetingTypeDto>(meetingTypeBaseFields).min(1)
