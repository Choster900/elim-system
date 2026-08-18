import { OFFERING_SEES_ALL_ROLE_CODES, SUPERVISOR_ROLE_CODE } from '../constants/auth.constants'
import {
    findMeetingIdsByLeaderUserId,
    findSupervisedSectorIdsByUserId,
} from '../repositories/auth.repository'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type { AuthenticatedUserContext } from '../types/auth.types'

/**
 * Resuelve qué ocurrencias puede ver y capturar el usuario autenticado.
 * - Administración y finanzas ven todo.
 * - El supervisor ve los sectores que tiene asignados.
 * - El líder y el co-supervisor ven únicamente sus reuniones, que no se pueden
 *   expresar por sector porque conviven con las del supervisor en el mismo sector.
 *
 * Los dos alcances se suman: un supervisor que además lidera una reunión de otro
 * sector ve ambas cosas.
 */
export async function resolveOccurrenceScope(
    auth: AuthenticatedUserContext,
): Promise<OccurrenceScopeFilter> {
    const seesAll = auth.roles.some((role) => OFFERING_SEES_ALL_ROLE_CODES.includes(role))
    if (seesAll) {
        return { seesAll: true, sectorIds: [], meetingIds: [] }
    }

    const [sectorIds, meetingIds] = await Promise.all([
        auth.roles.includes(SUPERVISOR_ROLE_CODE)
            ? findSupervisedSectorIdsByUserId(auth.userId)
            : Promise.resolve<number[]>([]),
        findMeetingIdsByLeaderUserId(auth.userId),
    ])

    return { seesAll: false, sectorIds, meetingIds }
}
