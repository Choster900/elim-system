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
    supervisorId: Joi.number().integer().positive(),
    coSupervisorIds: Joi.array().items(Joi.number().integer().positive()).default([]),
    title: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(300).allow('', null),
    date: Joi.string().isoDate(),
    startTime: Joi.string().pattern(timePattern),
    endTime: Joi.string().pattern(timePattern),
    location: Joi.string().trim().min(2).max(300),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),
    frequency: Joi.string().valid('unica', 'semanal', 'quincenal', 'mensual'),
    expectedAttendees: Joi.number().integer().min(0).max(1000000),
    status: Joi.string().valid('programada', 'en_curso', 'completada', 'cancelada'),
    isPublic: Joi.boolean(),
    notes: Joi.string().trim().max(600).allow('', null),
    color: Joi.string()
        .trim()
        .pattern(/^#[0-9a-f]{6}$/i),
}

const requiredBaseFields = {
    typeId: baseFields.typeId.required(),
    sectorId: baseFields.sectorId.required(),
    supervisorId: baseFields.supervisorId.required(),
    coSupervisorIds: baseFields.coSupervisorIds,
    title: baseFields.title.required(),
    description: baseFields.description.default(null),
    date: baseFields.date.required(),
    startTime: baseFields.startTime.required(),
    endTime: baseFields.endTime.required(),
    location: baseFields.location.required(),
    latitude: baseFields.latitude.default(null),
    longitude: baseFields.longitude.default(null),
    frequency: baseFields.frequency.default('unica'),
    expectedAttendees: baseFields.expectedAttendees.default(0),
    status: baseFields.status.default('programada'),
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
