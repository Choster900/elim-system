import { OFFERING_SEES_ALL_ROLE_CODES, SUPERVISOR_ROLE_CODE } from '../constants/auth.constants'
import { findSupervisedSectorIdsByUserId } from '../repositories/auth.repository'
import type { AuthenticatedUserContext } from '../types/auth.types'

export interface OfferingScope {
    // When true, the user sees every sector's meetings/offerings (no filter).
    seesAll: boolean
    // Sector ids the user is restricted to when `seesAll` is false.
    sectorIds: number[]
}

/**
 * Resolves which meetings/offerings the authenticated user is allowed to see.
 * - Admin/finance roles bypass the filter entirely.
 * - Supervisors are scoped to their assigned sectors (TerritorySector.supervisorId).
 * - Any other role is scoped to nothing for now (leader behaviour is deferred).
 */
export async function resolveOfferingScope(auth: AuthenticatedUserContext): Promise<OfferingScope> {
    const seesAll = auth.roles.some((role) => OFFERING_SEES_ALL_ROLE_CODES.includes(role))
    if (seesAll) {
        return { seesAll: true, sectorIds: [] }
    }

    if (auth.roles.includes(SUPERVISOR_ROLE_CODE)) {
        const sectorIds = await findSupervisedSectorIdsByUserId(auth.userId)
        return { seesAll: false, sectorIds }
    }

    return { seesAll: false, sectorIds: [] }
}
