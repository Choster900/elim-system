import Joi from 'joi'
import {
    MEMBER_GENDER_OPTIONS,
    MEMBER_MARITAL_STATUS_OPTIONS,
    MEMBER_ROLE_CODES,
    MEMBER_STATUS_OPTIONS,
} from '../constants/member.constants'
import type { CreateMemberDto, ImportMembersDto, UpdateMemberDto } from '../dto/member/member.dto'
import { isValidDui, normalizeDui } from '#shared/utils/dui.util'

const optionalText = (maximum: number) => Joi.string().trim().max(maximum).allow('', null)
const date = Joi.string().isoDate().allow(null)

const fields = {
    code: Joi.string()
        .trim()
        .uppercase()
        .min(2)
        .max(30)
        .pattern(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/),
    firstName: Joi.string().trim().min(2).max(100),
    middleName: optionalText(100),
    lastName: Joi.string().trim().min(2).max(100),
    secondLastName: optionalText(100),
    preferredName: optionalText(100),
    documentNumber: Joi.string()
        .trim()
        .custom((value: string, helpers) => {
            const dui = normalizeDui(value)
            return isValidDui(dui) ? dui : helpers.error('string.dui')
        })
        .messages({
            'string.dui': 'El documento debe ser un DUI válido con formato 00000000-0.',
        }),
    birthDate: date,
    gender: Joi.string().valid(...MEMBER_GENDER_OPTIONS.map((option) => option.value)),
    maritalStatus: Joi.string().valid(
        ...MEMBER_MARITAL_STATUS_OPTIONS.map((option) => option.value),
    ),
    phone: optionalText(100),
    alternatePhone: optionalText(100),
    email: Joi.string().trim().email().max(100).allow('', null),
    address: optionalText(300),
    country: optionalText(100),
    municipality: optionalText(100),
    department: optionalText(100),
    occupation: optionalText(100),
    status: Joi.string().valid(...MEMBER_STATUS_OPTIONS.map((option) => option.value)),
    roles: Joi.array()
        .items(Joi.string().valid(...MEMBER_ROLE_CODES))
        .min(1)
        .max(MEMBER_ROLE_CODES.length)
        .unique(),
    ministries: Joi.array().items(Joi.string().trim().min(1).max(100)).max(20).unique(),
    joinedAt: date,
    conversionDate: date,
    baptismDate: date,
    sector: Joi.string().trim().min(1).max(100),
    smallGroup: optionalText(100),
    emergencyContactName: optionalText(100),
    emergencyContactPhone: optionalText(100),
    notes: optionalText(600),
}

const requiredFields = {
    code: fields.code.optional(),
    firstName: fields.firstName.required(),
    middleName: fields.middleName.default(null),
    lastName: fields.lastName.required(),
    secondLastName: fields.secondLastName.default(null),
    preferredName: fields.preferredName.default(null),
    documentNumber: fields.documentNumber.required(),
    birthDate: fields.birthDate.default(null),
    gender: fields.gender.required(),
    maritalStatus: fields.maritalStatus.default('UNSPECIFIED'),
    phone: fields.phone.default(null),
    alternatePhone: fields.alternatePhone.default(null),
    email: fields.email.default(null),
    address: fields.address.default(null),
    country: fields.country.default(null),
    municipality: fields.municipality.default(null),
    department: fields.department.default(null),
    occupation: fields.occupation.default(null),
    status: fields.status.default('ACTIVE'),
    roles: fields.roles.default(['MEMBER']),
    ministries: fields.ministries.default([]),
    joinedAt: fields.joinedAt.default(null),
    conversionDate: fields.conversionDate.default(null),
    baptismDate: fields.baptismDate.default(null),
    sector: fields.sector.required(),
    smallGroup: fields.smallGroup.default(null),
    emergencyContactName: fields.emergencyContactName.default(null),
    emergencyContactPhone: fields.emergencyContactPhone.default(null),
    notes: fields.notes.default(null),
}

export const createMemberSchema = Joi.object<CreateMemberDto>(requiredFields)
export const updateMemberSchema = Joi.object<UpdateMemberDto>(fields).min(1)

export const importMembersSchema = Joi.object<ImportMembersDto>({
    rows: Joi.array()
        .items(
            Joi.object({
                rowNumber: Joi.number().integer().min(2).required(),
                member: Joi.object().unknown(true).required(),
            }),
        )
        .min(1)
        .max(1000)
        .required(),
})
