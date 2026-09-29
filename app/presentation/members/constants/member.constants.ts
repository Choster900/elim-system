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
    { value: 'COORDINATOR', label: 'Coordinador/a' },
    { value: 'HOST', label: 'Anfitrión/a' },
    { value: 'SUPERVISOR', label: 'Supervisor/a' },
    { value: 'DEACON', label: 'Diácono/a' },
    { value: 'VOLUNTEER', label: 'Voluntario/a' },
    { value: 'TEACHER', label: 'Maestro/a' },
    { value: 'WORSHIP', label: 'Alabanza' },
    { value: 'YOUTH_LEADER', label: 'Líder de jóvenes' },
    { value: 'CHILDREN_LEADER', label: 'Líder infantil' },
    { value: 'ELDER', label: 'Anciano' },
    { value: 'SUPPORT_COMMITTEE', label: 'Comité de apoyo' },
    { value: 'ASSOCIATE_PASTOR', label: 'Pastor asociado' },
    { value: 'EVANGELIST', label: 'Evangelista' },
    { value: 'MISSIONARY', label: 'Misionero' },
    { value: 'WORSHIP_LEADER', label: 'Líder de alabanza' },
    { value: 'SMALL_GROUP_LEADER', label: 'Líder de célula' },
    { value: 'DISCIPLESHIP_LEADER', label: 'Discipulador' },
    { value: 'INTERCESSOR', label: 'Intercesor' },
    { value: 'COUNSELOR', label: 'Consejero' },
    { value: 'USHER', label: 'Ujier' },
    { value: 'HOSPITALITY', label: 'Hospitalidad' },
    { value: 'MEDIA_TECHNICIAN', label: 'Multimedia' },
    { value: 'SOUND_TECHNICIAN', label: 'Sonido' },
    { value: 'MISSIONS_LEADER', label: 'Líder de misiones' },
    { value: 'EVANGELISM_LEADER', label: 'Líder de evangelismo' },
    { value: 'TREASURER', label: 'Tesorero' },
    { value: 'SECRETARY', label: 'Secretario' },
    { value: 'ADMINISTRATOR', label: 'Administrador' },
    { value: 'AUDITOR', label: 'Auditor' },
]
