import { createError } from 'h3'
import { validateEnv } from '../../config/env'
import type {
    CreateUserRequestDto,
    ResetUserPasswordRequestDto,
    UpdateUserRequestDto,
} from '../dto/users/user.dto'
import * as repository from '../repositories/user.repository'
import { ApiErrorCode } from '../types/api-response.types'
import { hashPassword } from '../utils/auth/password.util'
import {
    generateInvitationToken,
    generateTemporaryPassword,
    hashInvitationToken,
} from '../utils/auth/invitation-token.util'
import { sendAccessInvitationEmail } from './email.service'

type ManagedUser = NonNullable<Awaited<ReturnType<typeof repository.findUserForManagementById>>>

function fullName(member: ManagedUser['member']) {
    if (!member) return ''
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

function mapUser(user: ManagedUser) {
    const latestInvitation = user.receivedInvitations[0]
    return {
        id: user.id,
        memberId: user.memberId,
        memberCode: user.member?.code ?? 'SIN-MIEMBRO',
        memberName: fullName(user.member) || user.username || user.email,
        username: user.username ?? '',
        email: user.email,
        roles: user.userRoles.map(({ role }) => role.code),
        status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
        mustChangePassword: user.mustChangePassword,
        lastAccessAt: user.lastAccessAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        invitationExpiresAt: latestInvitation?.expiresAt.toISOString() ?? null,
        invitationUsedAt: latestInvitation?.usedAt?.toISOString() ?? null,
    }
}

function invalidRolesError() {
    return createError({
        statusCode: 400,
        message: 'Uno o más roles no existen o están inactivos',
        data: {
            code: ApiErrorCode.VALIDATION_ERROR,
            fields: { roleCodes: ['Selecciona únicamente roles activos.'] },
        },
    })
}

function mailDeliveryError() {
    return createError({
        statusCode: 502,
        message: 'No fue posible entregar las credenciales por correo',
        data: { code: ApiErrorCode.SERVICE_UNAVAILABLE },
    })
}

function invitationExpiration(hours: number) {
    return new Date(Date.now() + hours * 60 * 60 * 1000)
}

async function resolveRoleIds(roleCodes: string[]) {
    const roles = await repository.findActiveRolesByCodes(roleCodes)
    if (roles.length !== new Set(roleCodes).size) throw invalidRolesError()
    return roles.map(({ id }) => id)
}

async function ensureUserCanBeActivated(userId: number, status: 'ACTIVE' | 'INVITED' | 'BLOCKED') {
    if (status !== 'ACTIVE' || !(await repository.hasPendingUserInvitation(userId))) return
    throw createError({
        statusCode: 409,
        message:
            'Este usuario tiene una invitación pendiente. Restablece y reenvía su acceso para habilitarlo de forma segura.',
        data: { code: ApiErrorCode.BUSINESS_RULE_ERROR },
    })
}

export async function getUsers() {
    const users = await repository.findUsersForManagement()
    return users.map(mapUser)
}

export async function getUserCatalog() {
    const [members, roles] = await Promise.all([
        repository.findUserCatalogMembers(),
        repository.findActiveSystemRoles(),
    ])

    return {
        members: members.map((member) => ({
            id: member.id,
            code: member.code,
            fullName: [member.firstName, member.middleName, member.lastName, member.secondLastName]
                .filter(Boolean)
                .join(' '),
            email: member.email,
            phone: member.phone,
            communityRoles: member.communityRoles.map(({ role }) => role.name),
            assignedUserId: member.user?.id ?? null,
        })),
        roles: roles.map((role) => ({
            value: role.code,
            label: role.name,
            description: role.description ?? '',
        })),
        defaultInvitationExpiresInHours: validateEnv().USER_INVITATION_TTL_HOURS,
    }
}

export async function createUser(dto: CreateUserRequestDto, createdById: number) {
    const roleIds = await resolveRoleIds(dto.roleCodes)
    const temporaryPassword = generateTemporaryPassword()
    const invitationToken = generateInvitationToken()
    const expiresAt = invitationExpiration(dto.invitationExpiresInHours)
    const user = await repository.createUserRecord({
        memberId: dto.memberId,
        username: dto.username,
        email: dto.email,
        passwordHash: await hashPassword(temporaryPassword),
        roleIds,
        requirePasswordChange: dto.requirePasswordChange,
        twoFactorEnabled: dto.twoFactorEnabled,
        invitationTokenHash: hashInvitationToken(invitationToken),
        invitationExpiresAt: expiresAt,
        createdById,
    })

    try {
        await sendAccessInvitationEmail({
            email: user.email,
            displayName: fullName(user.member) || user.username || user.email,
            temporaryPassword,
            invitationToken,
            expiresAt,
            requirePasswordChange: user.mustChangePassword,
        })
    } catch {
        await repository.deleteUserRecord(user.id)
        throw mailDeliveryError()
    }

    return mapUser(user)
}

export async function updateUser(userId: number, dto: UpdateUserRequestDto, assignedById: number) {
    await ensureUserCanBeActivated(userId, dto.status)
    const roleIds = await resolveRoleIds(dto.roleCodes)
    const user = await repository.updateUserRecord(userId, {
        username: dto.username,
        email: dto.email,
        roleIds,
        status: dto.status,
        requirePasswordChange: dto.requirePasswordChange,
        twoFactorEnabled: dto.twoFactorEnabled,
        assignedById,
    })
    if (!user) {
        throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    }
    return mapUser(user)
}

export async function updateUserStatus(userId: number, status: 'ACTIVE' | 'BLOCKED') {
    await ensureUserCanBeActivated(userId, status)
    return mapUser(await repository.updateUserStatusRecord(userId, status))
}

export async function resetUserPassword(
    userId: number,
    dto: ResetUserPasswordRequestDto,
    createdById: number,
) {
    const currentUser = await repository.findUserForManagementById(userId)
    if (!currentUser) {
        throw createError({ statusCode: 404, message: 'Usuario no encontrado' })
    }

    const temporaryPassword = generateTemporaryPassword()
    const invitationToken = generateInvitationToken()
    const expiresAt = invitationExpiration(dto.invitationExpiresInHours)
    const reset = await repository.prepareUserAccessReset(userId, {
        passwordHash: await hashPassword(temporaryPassword),
        requirePasswordChange: dto.requirePasswordChange,
        invitationTokenHash: hashInvitationToken(invitationToken),
        invitationExpiresAt: expiresAt,
        createdById,
    })

    try {
        await sendAccessInvitationEmail({
            email: reset.user.email,
            displayName: fullName(reset.user.member) || reset.user.username || reset.user.email,
            temporaryPassword,
            invitationToken,
            expiresAt,
            requirePasswordChange: reset.user.mustChangePassword,
        })
    } catch {
        await repository.rollbackUserAccessReset(
            userId,
            reset.invitation.id,
            reset.previous,
            reset.revokedInvitationIds,
        )
        throw mailDeliveryError()
    }

    await repository.revokeAllUserSessions(userId)
    return mapUser(reset.user)
}

export async function validateInvitation(invitationToken: string) {
    const invitation = await repository.findInvitationByTokenHash(
        hashInvitationToken(invitationToken),
    )
    if (!invitation || invitation.usedAt || invitation.revokedAt) {
        throw createError({
            statusCode: 401,
            message: 'La invitación no es válida o ya fue utilizada',
            data: { code: ApiErrorCode.INVALID_TOKEN },
        })
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
        throw createError({
            statusCode: 401,
            message: 'La invitación ha expirado',
            data: { code: ApiErrorCode.TOKEN_EXPIRED },
        })
    }
    if (!invitation.user.isActive || invitation.user.status === 'BLOCKED') {
        throw createError({
            statusCode: 403,
            message: 'El usuario de esta invitación no está habilitado',
            data: { code: ApiErrorCode.FORBIDDEN },
        })
    }

    return {
        email: invitation.user.email,
        displayName:
            fullName(invitation.user.member) || invitation.user.username || invitation.user.email,
        expiresAt: invitation.expiresAt.toISOString(),
        requirePasswordChange: invitation.user.mustChangePassword,
    }
}
