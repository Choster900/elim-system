import type {
    MemberCommunityRole,
    MemberGender,
    MemberMaritalStatus,
    MemberStatus,
} from '../interfaces/member.interface'

export const memberStatusOptions: { value: MemberStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
    { value: 'VISITOR', label: 'Visitante' },
    { value: 'TRANSFERRED', label: 'Trasladado' },
    { value: 'DECEASED', label: 'Fallecido' },
]

export const memberGenderOptions: { value: MemberGender; label: string }[] = [
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'MALE', label: 'Masculino' },
    { value: 'OTHER', label: 'Otro' },
    { value: 'UNSPECIFIED', label: 'Sin especificar' },
]

export const memberMaritalStatusOptions: { value: MemberMaritalStatus; label: string }[] = [
    { value: 'SINGLE', label: 'Soltero/a' },
    { value: 'MARRIED', label: 'Casado/a' },
    { value: 'DIVORCED', label: 'Divorciado/a' },
    { value: 'WIDOWED', label: 'Viudo/a' },
    { value: 'UNION', label: 'Unión estable' },
    { value: 'UNSPECIFIED', label: 'Sin especificar' },
]

export const memberRoleOptions: { value: MemberCommunityRole; label: string }[] = [
    { value: 'MEMBER', label: 'Miembro' },
    { value: 'PASTOR', label: 'Pastor/a' },
    { value: 'LEADER', label: 'Líder' },
    { value: 'HOST', label: 'Anfitrión/a' },
    { value: 'SUPERVISOR', label: 'Supervisor/a' },
    { value: 'DEACON', label: 'Diácono/a' },
    { value: 'VOLUNTEER', label: 'Voluntario/a' },
    { value: 'TEACHER', label: 'Maestro/a' },
    { value: 'WORSHIP', label: 'Alabanza' },
    { value: 'YOUTH_LEADER', label: 'Líder de jóvenes' },
    { value: 'CHILDREN_LEADER', label: 'Líder infantil' },
]

export const elSalvadorDepartments = [
    'Ahuachapán',
    'Cabañas',
    'Chalatenango',
    'Cuscatlán',
    'La Libertad',
    'La Paz',
    'La Unión',
    'Morazán',
    'San Miguel',
    'San Salvador',
    'San Vicente',
    'Santa Ana',
    'Sonsonate',
    'Usulután',
].map((value) => ({ value, label: value }))
