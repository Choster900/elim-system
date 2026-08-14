import {
    memberGenderOptions,
    memberMaritalStatusOptions,
    memberRoleOptions,
    memberStatusOptions,
} from '../constants/member.constants'
import type {
    Member,
    MemberCommunityRole,
    MemberGender,
    MemberMaritalStatus,
    MemberStatus,
} from '../interfaces/member.interface'

export function getMemberFullName(member: Member) {
    return [member.firstName, member.middleName, member.lastName, member.secondLastName]
        .filter(Boolean)
        .join(' ')
}

export function getMemberStatusLabel(status: MemberStatus) {
    return memberStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getMemberGenderLabel(gender: MemberGender) {
    return memberGenderOptions.find((option) => option.value === gender)?.label ?? gender
}

export function getMemberMaritalStatusLabel(status: MemberMaritalStatus) {
    return memberMaritalStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getMemberRoleLabel(role: MemberCommunityRole) {
    return memberRoleOptions.find((option) => option.value === role)?.label ?? role
}

export function getMemberAge(birthDate: string | null) {
    if (!birthDate) return null
    const birth = new Date(`${birthDate.slice(0, 10)}T00:00:00`)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
    return age
}

export function toInputDate(value: string | null) {
    return value?.slice(0, 10) ?? null
}
