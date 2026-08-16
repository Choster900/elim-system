import * as repo from '../repositories/member.repository'

export function getMembers() {
    return repo.findMembers()
}
