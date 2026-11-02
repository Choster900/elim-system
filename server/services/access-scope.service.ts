import { OFFERING_SEES_ALL_ROLE_CODES } from '../constants/auth.constants'
import {
    findCoordinatedZoneSectorIdsByUserId,
    findMeetingIdsByLeaderUserId,
    findSupervisedSectorIdsByUserId,
} from '../repositories/auth.repository'
import type { OccurrenceScopeFilter } from '../dto/offering/occurrence.dto'
import type { AuthenticatedUserContext } from '../types/auth.types'

export async function resolveOccurrenceScope(
    auth: AuthenticatedUserContext,
): Promise<OccurrenceScopeFilter> {
    const seesAll = auth.roles.some((role) => OFFERING_SEES_ALL_ROLE_CODES.includes(role))
    if (seesAll) {
        return { seesAll: true, sectorIds: [], meetingIds: [] }
    }

    const [supervisedSectorIds, zoneSectorIds, meetingIds] = await Promise.all([
        findSupervisedSectorIdsByUserId(auth.userId),
        findCoordinatedZoneSectorIdsByUserId(auth.userId),
        findMeetingIdsByLeaderUserId(auth.userId),
    ])
    const sectorIds = [...new Set([...supervisedSectorIds, ...zoneSectorIds])]

    return { seesAll: false, sectorIds, meetingIds }
}
