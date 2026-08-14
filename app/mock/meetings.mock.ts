export type MeetingStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada'
export type MeetingFrequency = 'unica' | 'semanal' | 'quincenal' | 'mensual'
export type LatLng = [number, number]

export interface MockSector {
  id: string
  name: string
  code: string
}

export interface MockSupervisor {
  id: string
  name: string
  role: string
}

export interface MockMeetingType {
  id: string
  label: string
  accent: string
}

export interface MockMeeting {
  id: string
  title: string
  description: string
  typeId: string
  sectorId: string
  supervisorId: string
  coSupervisorIds: string[]
  date: string
  startTime: string
  endTime: string
  location: string
  frequency: MeetingFrequency
  expectedAttendees: number
  status: MeetingStatus
  isPublic: boolean
  notes: string
  color: string
  position: LatLng | null
  createdAt: string
}

export const mockSectors: MockSector[] = [
  { id: 'sec-norte', name: 'Sector Norte', code: 'N' },
  { id: 'sec-sur', name: 'Sector Sur', code: 'S' },
  { id: 'sec-este', name: 'Sector Este', code: 'E' },
  { id: 'sec-oeste', name: 'Sector Oeste', code: 'O' },
  { id: 'sec-centro', name: 'Sector Centro', code: 'C' },
]

export const mockSupervisors: MockSupervisor[] = [
  { id: 'sup-1', name: 'Daniel Hernández', role: 'Pastor Principal' },
  { id: 'sup-2', name: 'María González', role: 'Líder de Adoración' },
  { id: 'sup-3', name: 'Carlos Pérez', role: 'Director de Jóvenes' },
  { id: 'sup-4', name: 'Lucía Ramírez', role: 'Coordinadora de Células' },
  { id: 'sup-5', name: 'Roberto Quintanilla', role: 'Líder de Hombres' },
  { id: 'sup-6', name: 'Andrea Martínez', role: 'Líder de Mujeres' },
  { id: 'sup-7', name: 'Esteban Cruz', role: 'Diácono' },
  { id: 'sup-8', name: 'Patricia Fuentes', role: 'Ministerio Infantil' },
]

export const mockMeetingTypes: MockMeetingType[] = [
  { id: 'tip-servicio', label: 'Servicio Dominical', accent: '#e9c176' },
  { id: 'tip-celula', label: 'Célula Familiar', accent: '#9bc1bc' },
  { id: 'tip-liderazgo', label: 'Reunión de Liderazgo', accent: '#d39a9a' },
  { id: 'tip-capacitacion', label: 'Capacitación', accent: '#a3b18a' },
  { id: 'tip-vigilia', label: 'Vigilia de Oración', accent: '#b4a7d6' },
  { id: 'tip-estudio', label: 'Estudio Bíblico', accent: '#f4a261' },
  { id: 'tip-ensayo', label: 'Ensayo de Adoración', accent: '#8ab0d9' },
]

export const frequencyOptions: { value: MeetingFrequency, label: string }[] = [
  { value: 'unica', label: 'Única vez' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
]

export const statusOptions: { value: MeetingStatus, label: string }[] = [
  { value: 'programada', label: 'Programada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
]

export const colorPalette = ['#e9c176', '#9bc1bc', '#d39a9a', '#a3b18a', '#b4a7d6', '#f4a261', '#8ab0d9']

function isoOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const SEED_BASE_ISO = '2026-01-01T00:00:00.000Z'

export function getMockMeetings(): MockMeeting[] {
  const nowIso = SEED_BASE_ISO
  const seeds: Omit<MockMeeting, 'id' | 'position'>[] = [
    {
      title: 'Servicio Dominical de Adoración',
      description: 'Encuentro central de la semana. Tiempo de adoración y exposición de la Palabra.',
      typeId: 'tip-servicio',
      sectorId: 'sec-centro',
      supervisorId: 'sup-1',
      coSupervisorIds: ['sup-2'],
      date: isoOffset(2),
      startTime: '09:00',
      endTime: '11:30',
      location: 'Salón Principal',
      frequency: 'semanal',
      expectedAttendees: 320,
      status: 'programada',
      isPublic: true,
      notes: 'Comunión al cierre del servicio.',
      color: '#e9c176',
      createdAt: nowIso,
    },
    {
      title: 'Célula del Buen Pastor',
      description: 'Grupo pequeño de familias del sector norte.',
      typeId: 'tip-celula',
      sectorId: 'sec-norte',
      supervisorId: 'sup-4',
      coSupervisorIds: [],
      date: isoOffset(4),
      startTime: '19:30',
      endTime: '21:00',
      location: 'Casa de la familia Mendoza',
      frequency: 'semanal',
      expectedAttendees: 14,
      status: 'programada',
      isPublic: false,
      notes: '',
      color: '#9bc1bc',
      createdAt: nowIso,
    },
    {
      title: 'Reunión de Líderes de Sector',
      description: 'Revisión mensual del avance ministerial por sector.',
      typeId: 'tip-liderazgo',
      sectorId: 'sec-centro',
      supervisorId: 'sup-1',
      coSupervisorIds: ['sup-7'],
      date: isoOffset(7),
      startTime: '18:00',
      endTime: '20:00',
      location: 'Sala de Consejo',
      frequency: 'mensual',
      expectedAttendees: 22,
      status: 'programada',
      isPublic: false,
      notes: 'Llevar reporte de asistencia trimestral.',
      color: '#d39a9a',
      createdAt: nowIso,
    },
    {
      title: 'Capacitación de Voluntarios',
      description: 'Inducción para nuevos servidores en el área de hospitalidad.',
      typeId: 'tip-capacitacion',
      sectorId: 'sec-sur',
      supervisorId: 'sup-6',
      coSupervisorIds: [],
      date: isoOffset(-3),
      startTime: '16:00',
      endTime: '18:30',
      location: 'Aula 2',
      frequency: 'unica',
      expectedAttendees: 18,
      status: 'completada',
      isPublic: false,
      notes: 'Material entregado en versión digital.',
      color: '#a3b18a',
      createdAt: nowIso,
    },
    {
      title: 'Vigilia de Inicio de Mes',
      description: 'Noche de oración intercesora abierta a toda la congregación.',
      typeId: 'tip-vigilia',
      sectorId: 'sec-centro',
      supervisorId: 'sup-5',
      coSupervisorIds: ['sup-3'],
      date: isoOffset(12),
      startTime: '22:00',
      endTime: '02:00',
      location: 'Templo',
      frequency: 'mensual',
      expectedAttendees: 90,
      status: 'programada',
      isPublic: true,
      notes: '',
      color: '#b4a7d6',
      createdAt: nowIso,
    },
    {
      title: 'Estudio Bíblico de Jueves',
      description: 'Recorrido por el libro de Hechos.',
      typeId: 'tip-estudio',
      sectorId: 'sec-este',
      supervisorId: 'sup-3',
      coSupervisorIds: [],
      date: isoOffset(-1),
      startTime: '19:00',
      endTime: '20:30',
      location: 'Salón Multipropósito',
      frequency: 'semanal',
      expectedAttendees: 45,
      status: 'cancelada',
      isPublic: true,
      notes: 'Cancelado por mantenimiento del local.',
      color: '#f4a261',
      createdAt: nowIso,
    },
    {
      title: 'Ensayo del Equipo de Alabanza',
      description: 'Preparación de repertorio para el servicio dominical.',
      typeId: 'tip-ensayo',
      sectorId: 'sec-centro',
      supervisorId: 'sup-2',
      coSupervisorIds: [],
      date: isoOffset(1),
      startTime: '20:00',
      endTime: '22:00',
      location: 'Templo · escenario',
      frequency: 'semanal',
      expectedAttendees: 12,
      status: 'programada',
      isPublic: false,
      notes: 'Repasar tres canciones nuevas.',
      color: '#8ab0d9',
      createdAt: nowIso,
    },
    {
      title: 'Célula de Jóvenes "Renuevo"',
      description: 'Encuentro semanal de jóvenes adultos.',
      typeId: 'tip-celula',
      sectorId: 'sec-oeste',
      supervisorId: 'sup-3',
      coSupervisorIds: ['sup-8'],
      date: isoOffset(5),
      startTime: '19:00',
      endTime: '21:00',
      location: 'Casa pastoral',
      frequency: 'semanal',
      expectedAttendees: 28,
      status: 'programada',
      isPublic: true,
      notes: '',
      color: '#9bc1bc',
      createdAt: nowIso,
    },
    {
      title: 'Asamblea General Anual',
      description: 'Presentación de informes y elección de nuevos diáconos.',
      typeId: 'tip-liderazgo',
      sectorId: 'sec-centro',
      supervisorId: 'sup-1',
      coSupervisorIds: ['sup-7', 'sup-4', 'sup-5', 'sup-2'],
      date: isoOffset(30),
      startTime: '17:00',
      endTime: '21:00',
      location: 'Salón Principal',
      frequency: 'unica',
      expectedAttendees: 280,
      status: 'programada',
      isPublic: true,
      notes: 'Requiere quórum mínimo del 60% de miembros activos.',
      color: '#d39a9a',
      createdAt: nowIso,
    },
    {
      title: 'Reunión de Damas',
      description: 'Café y compañerismo del ministerio de mujeres.',
      typeId: 'tip-celula',
      sectorId: 'sec-norte',
      supervisorId: 'sup-6',
      coSupervisorIds: [],
      date: isoOffset(-5),
      startTime: '09:30',
      endTime: '11:30',
      location: 'Aula Bethel',
      frequency: 'quincenal',
      expectedAttendees: 35,
      status: 'completada',
      isPublic: false,
      notes: '',
      color: '#9bc1bc',
      createdAt: nowIso,
    },
    {
      title: 'Escuela de Líderes · Módulo III',
      description: 'Formación pastoral avanzada para líderes en proceso.',
      typeId: 'tip-capacitacion',
      sectorId: 'sec-este',
      supervisorId: 'sup-1',
      coSupervisorIds: ['sup-4'],
      date: isoOffset(9),
      startTime: '18:30',
      endTime: '20:30',
      location: 'Aula Magna',
      frequency: 'semanal',
      expectedAttendees: 24,
      status: 'programada',
      isPublic: false,
      notes: 'Tema: Liderazgo de servicio según Marcos 10.',
      color: '#a3b18a',
      createdAt: nowIso,
    },
    {
      title: 'Servicio de Sanidad y Liberación',
      description: 'Servicio especial de oración por enfermos.',
      typeId: 'tip-servicio',
      sectorId: 'sec-sur',
      supervisorId: 'sup-1',
      coSupervisorIds: ['sup-5'],
      date: isoOffset(-10),
      startTime: '19:00',
      endTime: '21:30',
      location: 'Templo',
      frequency: 'mensual',
      expectedAttendees: 180,
      status: 'completada',
      isPublic: true,
      notes: '',
      color: '#e9c176',
      createdAt: nowIso,
    },
  ]

  return seeds.map((m, i) => ({
    ...m,
    id: `meet-${String(i + 1).padStart(3, '0')}`,
    position: null,
  }))
}
