import { prisma } from '../database/prisma'
import { mapPrismaError } from '../utils/database/prisma-error.util'

const userManagementInclude = {
    member: true,
    userRoles: {
        include: { role: true },
        orderBy: { role: { name: 'asc' as const } },
    },
    receivedInvitations: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
    },
} as const

interface CreateUserRecordInput {
    memberId: number
    username: string
    email: string
    passwordHash: string
    roleIds: number[]
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    invitationTokenHash: string
    invitationExpiresAt: Date
    createdById: number
}

interface UpdateUserRecordInput {
    username: string
    email: string
    roleIds: number[]
    status: 'ACTIVE' | 'INVITED' | 'BLOCKED'
    requirePasswordChange: boolean
    twoFactorEnabled: boolean
    assignedById: number
}

interface ResetUserAccessInput {
    passwordHash: string
    requirePasswordChange: boolean
    invitationTokenHash: string
    invitationExpiresAt: Date
    createdById: number
}

export function findUsersForManagement() {
    return prisma.user.findMany({
        include: userManagementInclude,
        orderBy: { createdAt: 'desc' },
    })
}

export function findUserForManagementById(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: userManagementInclude,
    })
}

export function findUserCatalogMembers() {
    return prisma.member.findMany({
        where: { status: 'ACTIVE' },
        include: {
            user: { select: { id: true } },
            communityRoles: {
                include: { role: true },
                orderBy: { role: { name: 'asc' } },
            },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
}

export function findActiveSystemRoles() {
    return prisma.role.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
    })
}

export function findActiveRolesByCodes(roleCodes: string[]) {
    return prisma.role.findMany({
        where: { code: { in: roleCodes }, status: 'ACTIVE' },
        select: { id: true, code: true },
    })
}

export async function hasPendingUserInvitation(userId: number) {
    const invitation = await prisma.userInvitation.findFirst({
        where: {
            userId,
            usedAt: null,
            revokedAt: null,
        },
        select: { id: true },
    })
    return !!invitation
}

export function createUserRecord(input: CreateUserRecordInput) {
    return prisma.user
        .create({
            data: {
                memberId: input.memberId,
                username: input.username,
                email: input.email,
                passwordHash: input.passwordHash,
                isActive: true,
                status: 'INVITED',
                mustChangePassword: input.requirePasswordChange,
                twoFactorEnabled: input.twoFactorEnabled,
                userRoles: {
                    create: input.roleIds.map((roleId) => ({
                        roleId,
                        assignedBy: input.createdById,
                    })),
                },
                receivedInvitations: {
                    create: {
                        tokenHash: input.invitationTokenHash,
                        expiresAt: input.invitationExpiresAt,
                        createdById: input.createdById,
                    },
                },
            },
            include: userManagementInclude,
        })
        .catch(mapPrismaError)
}

export function updateUserRecord(userId: number, input: UpdateUserRecordInput) {
    return prisma
        .$transaction(async (transaction) => {
            await transaction.user.update({
                where: { id: userId },
                data: {
                    username: input.username,
                    email: input.email,
                    status: input.status,
                    mustChangePassword: input.requirePasswordChange,
                    twoFactorEnabled: input.twoFactorEnabled,
                },
            })
            await transaction.userRole.deleteMany({ where: { userId } })
            await transaction.userRole.createMany({
                data: input.roleIds.map((roleId) => ({
                    userId,
                    roleId,
                    assignedBy: input.assignedById,
                })),
            })
            return transaction.user.findUnique({
                where: { id: userId },
                include: userManagementInclude,
            })
        })
        .catch(mapPrismaError)
}

export function updateUserStatusRecord(userId: number, status: 'ACTIVE' | 'BLOCKED') {
    return prisma.user
        .update({
            where: { id: userId },
            data: { status },
            include: userManagementInclude,
        })
        .catch(mapPrismaError)
}

export function deleteUserRecord(userId: number) {
    return prisma.user.delete({ where: { id: userId } }).catch(mapPrismaError)
}

export function prepareUserAccessReset(userId: number, input: ResetUserAccessInput) {
    return prisma
        .$transaction(async (transaction) => {
            const previous = await transaction.user.findUniqueOrThrow({
                where: { id: userId },
                select: {
                    passwordHash: true,
                    status: true,
                    mustChangePassword: true,
                },
            })
            const pendingInvitations = await transaction.userInvitation.findMany({
                where: { userId, usedAt: null, revokedAt: null },
                select: { id: true },
            })
            const revokedInvitationIds = pendingInvitations.map(({ id }) => id)

            if (revokedInvitationIds.length) {
                await transaction.userInvitation.updateMany({
                    where: { id: { in: revokedInvitationIds } },
                    data: { revokedAt: new Date() },
                })
            }

            await transaction.user.update({
                where: { id: userId },
                data: {
                    passwordHash: input.passwordHash,
                    status: 'INVITED',
                    mustChangePassword: input.requirePasswordChange,
                },
            })
            const invitation = await transaction.userInvitation.create({
                data: {
                    userId,
                    tokenHash: input.invitationTokenHash,
                    expiresAt: input.invitationExpiresAt,
                    createdById: input.createdById,
                },
            })
            const user = await transaction.user.findUniqueOrThrow({
                where: { id: userId },
                include: userManagementInclude,
            })

            return { user, invitation, previous, revokedInvitationIds }
        })
        .catch(mapPrismaError)
}

export function rollbackUserAccessReset(
    userId: number,
    invitationId: number,
    previous: {
        passwordHash: string
        status: 'ACTIVE' | 'INVITED' | 'BLOCKED'
        mustChangePassword: boolean
    },
    revokedInvitationIds: number[],
) {
    return prisma.$transaction(async (transaction) => {
        await transaction.user.update({
            where: { id: userId },
            data: previous,
        })
        await transaction.userInvitation.delete({ where: { id: invitationId } })
        if (revokedInvitationIds.length) {
            await transaction.userInvitation.updateMany({
                where: { id: { in: revokedInvitationIds } },
                data: { revokedAt: null },
            })
        }
    })
}

export function findInvitationByTokenHash(tokenHash: string) {
    return prisma.userInvitation.findUnique({
        where: { tokenHash },
        include: {
            user: {
                include: { member: true },
            },
        },
    })
}

export function consumeInvitation(invitationId: number, userId: number) {
    return prisma.$transaction(async (transaction) => {
        const consumed = await transaction.userInvitation.updateMany({
            where: {
                id: invitationId,
                userId,
                usedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date() },
        })
        if (consumed.count !== 1) return false

        await transaction.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE', lastAccessAt: new Date() },
        })
        return true
    })
}

export function recordUserAccess(userId: number) {
    return prisma.user.update({
        where: { id: userId },
        data: { lastAccessAt: new Date() },
    })
}

export function changeUserPasswordRecord(userId: number, passwordHash: string) {
    return prisma.$transaction(async (transaction) => {
        await transaction.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                mustChangePassword: false,
                status: 'ACTIVE',
            },
        })
        await transaction.authSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        })
    })
}

export function revokeAllUserSessions(userId: number) {
    return prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    })
}
