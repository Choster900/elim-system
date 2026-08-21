<script setup lang="ts">
import {
    AlertTriangle,
    Download,
    ExternalLink,
    FileDown,
    FileSpreadsheet,
    HandCoins,
    LoaderCircle,
    MapPinned,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Upload,
    X,
} from '@lucide/vue'
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
} from 'radix-vue'
import { useAuthStore } from '~/presentation/auth/stores/auth.store'
import { useUpdateMeetingMutation } from '~/presentation/meetings/composables/useMeetingMutations'
import { useMeetingsQuery } from '~/presentation/meetings/composables/useMeetingsQuery'
import type { MeetingRecord } from '~/presentation/meetings/interfaces/meeting.interface'
import { getMeetingFrequencyLabel } from '~/presentation/meetings/utils/meeting-format.util'
import { useAppToast } from '~/presentation/shared/composables/useAppToast'
import AssignMeetingDrawer from '~/presentation/territories/components/AssignMeetingDrawer.vue'
import TerritoryFormDrawer from '~/presentation/territories/components/TerritoryFormDrawer.vue'
import { useTerritoryHierarchyQuery } from '~/presentation/territories/composables/useTerritoryHierarchyQuery'
import { useTerritorySupervisorsQuery } from '~/presentation/territories/composables/useTerritorySupervisorsQuery'
import {
    useCreateTerritoryMutation,
    useDeleteTerritoryMutation,
    useImportTerritoriesMutation,
    useUpdateTerritoryMutation,
} from '~/presentation/territories/composables/useTerritoryMutations'
import {
    districtPalette,
    EL_SALVADOR_CENTER,
    sectorPalette,
    zonePalette,
} from '~/presentation/territories/constants/territory.constants'
import type {
    District,
    LatLng,
    Polygon,
    TerritoryHierarchy,
    TerritoryInput,
    TerritorySector,
    Zone,
} from '~/presentation/territories/interfaces/territory.interface'
import {
    downloadTerritoryImportFailures,
    downloadTerritoryTemplate,
    exportTerritoriesWorkbook,
    parseTerritoriesWorkbook,
    territoryImportRows,
    territoryImportSheetLabel,
    type TerritoryImportFailure,
    type TerritoryImportPreview,
    type TerritoryImportResult,
} from '~/presentation/territories/services/territory-excel.service'
defineOptions({ name: 'TerritoriesView' })

useHead({
    title: 'Distritos · Sistema',
})

type Level = 'distrito' | 'zona' | 'sector' | 'reunion'
type EntityLevel = 'distrito' | 'zona' | 'sector'

// Level accent colors, drawn from the app palette so they harmonize with the gold primary.
const LEVEL_ACCENT: Record<Level, string> = {
    distrito: '#e9c176',
    zona: '#f4a261',
    sector: '#a3b18a',
    reunion: '#8ab0d9',
}
const LEVEL_LABEL: Record<Level, string> = {
    distrito: 'Distrito',
    zona: 'Zona',
    sector: 'Sector',
    reunion: 'Reunión',
}

const toast = useAppToast()
const authStore = useAuthStore()
const canManage = computed(() => authStore.hasPermission('territories.manage'))
const canManageMeetings = computed(() => authStore.hasPermission('meetings.manage'))
const canManageOfferings = computed(() => authStore.hasPermission('finance.manage'))
const hierarchyQuery = useTerritoryHierarchyQuery()
const supervisorsQuery = useTerritorySupervisorsQuery()
const meetingsQuery = useMeetingsQuery()
const createTerritoryMutation = useCreateTerritoryMutation()
const updateTerritoryMutation = useUpdateTerritoryMutation()
const deleteTerritoryMutation = useDeleteTerritoryMutation()
const importTerritoriesMutation = useImportTerritoriesMutation()
const updateMeetingMutation = useUpdateMeetingMutation()

const districts = computed(() => hierarchyQuery.data.value?.districts ?? [])
const zones = computed(() => hierarchyQuery.data.value?.zones ?? [])
const sectors = computed(() => hierarchyQuery.data.value?.sectors ?? [])
const meetings = computed(() => meetingsQuery.data.value ?? [])
const supervisors = computed(() => supervisorsQuery.data.value ?? [])
const catalogLoading = computed(
    () => hierarchyQuery.isPending.value || meetingsQuery.isPending.value,
)
const hierarchySaving = computed(
    () =>
        createTerritoryMutation.isPending.value ||
        updateTerritoryMutation.isPending.value ||
        deleteTerritoryMutation.isPending.value,
)
const catalogError = computed(() => {
    if (hierarchyQuery.error.value) {
        return requestErrorMessage(
            hierarchyQuery.error.value,
            'No fue posible cargar el mantenimiento territorial.',
        )
    }
    if (meetingsQuery.error.value) {
        return requestErrorMessage(
            meetingsQuery.error.value,
            'No fue posible cargar las reuniones del catálogo.',
        )
    }
    return ''
})
const supervisorCatalogError = computed(() =>
    supervisorsQuery.error.value
        ? requestErrorMessage(
              supervisorsQuery.error.value,
              'No fue posible cargar el catálogo de supervisores.',
          )
        : '',
)

const selD = ref<string | null>(null)
const selZ = ref<string | null>(null)
const selS = ref<string | null>(null)
const selM = ref<string | null>(null)
const query = ref('')

// Context menu
const menuFor = ref<string | null>(null)
const menuLevel = ref<Level | null>(null)
const menuPos = reactive({ left: 0, top: 0 })
const menuMode = ref<'normal' | 'confirm' | 'move'>('normal')

// Detail drawer
const drawer = ref<{ level: Level; id: string } | null>(null)

// Entity form drawer (create/edit district/zone/sector)
const formOpen = ref(false)
const formLevel = ref<EntityLevel>('distrito')
const formMode = ref<'create' | 'edit'>('create')
const formEntity = ref<TerritoryInput | null>(null)
const formParentCentroid = ref<LatLng | null>(null)
const formParentLabel = ref<string | null>(null)
let formEditId: string | null = null
let formParentDistrictId: string | null = null
let formParentZoneId: string | null = null

// Assign-meeting drawer
const assignOpen = ref(false)

function requestErrorMessage(error: unknown, fallback: string) {
    const response = (
        error as { response?: { data?: { message?: string; error?: { details?: string } } } }
    )?.response?.data
    if (response?.error?.details) return response.error.details
    if (response?.message) return response.message
    if (error instanceof Error && error.message) return error.message
    return fallback
}

function synchronizeSelection(hierarchy: TerritoryHierarchy) {
    if (selD.value && !hierarchy.districts.some((district) => district.id === selD.value)) {
        clearSelection()
    }
    if (!selD.value) selD.value = hierarchy.districts[0]?.id ?? null
    if (
        selZ.value &&
        !hierarchy.zones.some((zone) => zone.id === selZ.value && zone.districtId === selD.value)
    ) {
        selZ.value = null
        selS.value = null
        selM.value = null
    }
    if (
        selS.value &&
        !hierarchy.sectors.some(
            (sector) => sector.id === selS.value && sector.zoneId === selZ.value,
        )
    ) {
        selS.value = null
        selM.value = null
    }
}

watch(
    () => hierarchyQuery.data.value,
    (hierarchy) => {
        if (hierarchy) synchronizeSelection(hierarchy)
    },
    { immediate: true },
)

if (import.meta.server) {
    onServerPrefetch(async () => {
        await Promise.allSettled([
            hierarchyQuery.suspense(),
            meetingsQuery.suspense(),
            supervisorsQuery.suspense(),
        ])
        const hierarchy = hierarchyQuery.data.value
        if (hierarchy) synchronizeSelection(hierarchy)
    })
}

if (import.meta.client) {
    watch(
        catalogError,
        (errorMessage) => {
            if (errorMessage) toast.error(errorMessage)
        },
        { immediate: true },
    )
    watch(
        supervisorCatalogError,
        (errorMessage) => {
            if (errorMessage) toast.error(errorMessage)
        },
        { immediate: true },
    )
}

function retryCatalog() {
    hierarchyQuery.refetch()
    meetingsQuery.refetch()
    supervisorsQuery.refetch()
}

const exporting = ref(false)
const downloadingTemplate = ref(false)
const parsingImportFile = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const importOpen = ref(false)
const importFileName = ref('')
const importPreview = ref<TerritoryImportPreview>({
    districts: [],
    zones: [],
    sectors: [],
    fileErrors: [],
})
const importResult = ref<TerritoryImportResult | null>(null)
const retryImportFailures = ref<TerritoryImportFailure[]>([])
const downloadingFailures = ref(false)
const importRows = computed(() => territoryImportRows(importPreview.value))
const validImportRows = computed(() => importRows.value.filter((row) => !row.issues.length))
const invalidImportRows = computed(() => importRows.value.filter((row) => row.issues.length))
const importErrors = computed(() => {
    if (importResult.value) {
        return retryImportFailures.value.flatMap((failure) =>
            failure.reasons.map(
                (reason) =>
                    `${territoryImportSheetLabel(failure.level)}, fila ${failure.rowNumber}: ${reason}`,
            ),
        )
    }
    return [
        ...importPreview.value.fileErrors,
        ...invalidImportRows.value.flatMap((row) =>
            row.issues.map(
                (issue) =>
                    `${territoryImportSheetLabel(row.level)}, fila ${row.rowNumber}: ${issue}`,
            ),
        ),
    ]
})
const importedTotal = computed(() =>
    importResult.value
        ? importResult.value.createdDistricts +
          importResult.value.createdZones +
          importResult.value.createdSectors
        : 0,
)

async function exportExcel() {
    const hierarchy = hierarchyQuery.data.value
    if (!hierarchy) {
        toast.error('La jerarquía territorial todavía no está disponible.')
        return
    }
    exporting.value = true
    try {
        await exportTerritoriesWorkbook(hierarchy, supervisors.value)
        toast.success('Jerarquía territorial exportada a Excel')
    } catch {
        toast.error('No fue posible generar el archivo territorial.')
    } finally {
        exporting.value = false
    }
}

async function downloadTemplate() {
    downloadingTemplate.value = true
    try {
        await downloadTerritoryTemplate(supervisors.value)
        toast.success('Plantilla territorial descargada')
    } catch {
        toast.error('No fue posible generar la plantilla territorial.')
    } finally {
        downloadingTemplate.value = false
    }
}

function pickImportFile() {
    importInput.value?.click()
}

async function onImportFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const hierarchy = hierarchyQuery.data.value
    if (!hierarchy) {
        toast.error('No fue posible cargar la jerarquía para validar el archivo.')
        return
    }

    parsingImportFile.value = true
    importFileName.value = file.name
    importResult.value = null
    retryImportFailures.value = []
    try {
        importPreview.value = await parseTerritoriesWorkbook(file, hierarchy, supervisors.value)
        importOpen.value = true
    } catch {
        toast.error('No pudimos leer el archivo. Verifica que sea un Excel .xlsx válido.')
    } finally {
        parsingImportFile.value = false
    }
}

function previewFailures(): TerritoryImportFailure[] {
    return invalidImportRows.value.map((row) => ({
        level: row.level,
        rowNumber: row.rowNumber,
        reasons: row.issues,
    }))
}

async function downloadPendingTerritories() {
    const failures = retryImportFailures.value.length
        ? retryImportFailures.value
        : previewFailures()
    if (!failures.length) return

    downloadingFailures.value = true
    try {
        await downloadTerritoryImportFailures(
            importPreview.value,
            failures,
            supervisors.value,
            importResult.value,
        )
        toast.success('Archivo de territorios pendientes descargado')
    } catch {
        toast.error('No fue posible generar el archivo de pendientes.')
    } finally {
        downloadingFailures.value = false
    }
}

async function confirmTerritoryImport() {
    const hierarchy = hierarchyQuery.data.value
    if (!hierarchy || !validImportRows.value.length) return

    try {
        const result = await importTerritoriesMutation.mutateAsync({
            preview: importPreview.value,
            hierarchy,
        })
        const failures = [...previewFailures(), ...result.failures].sort(
            (left, right) => left.rowNumber - right.rowNumber,
        )
        retryImportFailures.value = failures
        importResult.value = result

        if (failures.length) {
            await downloadTerritoryImportFailures(
                importPreview.value,
                failures,
                supervisors.value,
                result,
            )
            toast.warning(
                `${result.createdDistricts + result.createdZones + result.createdSectors} registros creados y ${failures.length} pendientes. Se descargó el archivo de corrección.`,
            )
        } else {
            toast.success(
                `Importación completa: ${result.createdDistricts} distritos, ${result.createdZones} zonas y ${result.createdSectors} sectores creados.`,
            )
            importOpen.value = false
        }
    } catch {
        toast.error('No fue posible iniciar la importación territorial.')
    }
}

// ===== lookups =====
function zonesOf(districtId: string) {
    return zones.value.filter((z) => z.districtId === districtId)
}
function sectorsOf(zoneId: string) {
    return sectors.value.filter((s) => s.zoneId === zoneId)
}
function meetingsOf(sectorId: string) {
    return meetings.value.filter((meeting) => String(meeting.sectorId) === sectorId)
}
function zoneMeetings(zone: Zone) {
    return sectorsOf(zone.id).reduce((acc, s) => acc + meetingsOf(s.id).length, 0)
}
function districtSectors(district: District) {
    return zonesOf(district.id).reduce((acc, z) => acc + sectorsOf(z.id).length, 0)
}
function districtMeetings(district: District) {
    return zonesOf(district.id).reduce((acc, z) => acc + zoneMeetings(z), 0)
}
function sectorLabelOf(sectorId: string) {
    return sectors.value.find((s) => s.id === sectorId)?.name ?? 'Sin sector'
}

const selDist = computed(() =>
    selD.value ? (districts.value.find((d) => d.id === selD.value) ?? null) : null,
)
const selZone = computed(() =>
    selZ.value && selDist.value
        ? (zonesOf(selDist.value.id).find((z) => z.id === selZ.value) ?? null)
        : null,
)
const selSector = computed(() =>
    selS.value && selZone.value
        ? (sectorsOf(selZone.value.id).find((s) => s.id === selS.value) ?? null)
        : null,
)

// ===== formatting & geometry =====
function plural(n: number, singular: string, pluralWord: string) {
    return `${n} ${n === 1 ? singular : pluralWord}`
}
function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}
function meetingDay(m: MeetingRecord) {
    return capitalize(
        new Date(`${m.date}T00:00:00`).toLocaleDateString('es-SV', { weekday: 'long' }),
    )
}
function fmtTime(time: string) {
    const [h, min] = time.split(':').map(Number)
    const period = (h ?? 0) < 12 ? 'AM' : 'PM'
    const hour12 = (((h ?? 0) + 11) % 12) + 1
    return `${hour12}:${String(min ?? 0).padStart(2, '0')} ${period}`
}
function centroid(polygon: Polygon): LatLng {
    const sum = polygon.reduce((acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng], [0, 0])
    return [sum[0]! / polygon.length, sum[1]! / polygon.length]
}
function paletteFor(level: EntityLevel) {
    if (level === 'distrito') return districtPalette
    if (level === 'zona') return zonePalette
    return sectorPalette
}

// ===== search =====
const normalizedQuery = computed(() => query.value.trim().toLowerCase())
function matches(...values: string[]) {
    const q = normalizedQuery.value
    return !q || values.some((value) => value.toLowerCase().includes(q))
}

// ===== columns =====
interface ColumnItem {
    id: string
    level: Level
    name: string
    code: string
    color: string
    sub: string
    badge: string
    selected: boolean
}
interface Column {
    level: Level
    label: string
    accent: string
    count: number
    canAdd: boolean
    addTitle: string
    hint: string | null
    empty: string | null
    items: ColumnItem[]
}

const columns = computed<Column[]>(() => {
    const cols: Column[] = []

    // Distritos
    const dItems = districts.value.filter((d) => matches(d.name, d.code))
    cols.push({
        level: 'distrito',
        label: 'Distritos',
        accent: LEVEL_ACCENT.distrito,
        count: districts.value.length,
        canAdd: canManage.value,
        addTitle: 'Agregar distrito',
        hint: null,
        empty: dItems.length === 0 ? 'Sin resultados' : null,
        items: dItems.map((d) => ({
            id: d.id,
            level: 'distrito',
            name: d.name,
            code: d.code,
            color: d.color,
            sub: `${plural(zonesOf(d.id).length, 'zona', 'zonas')}${d.isActive ? '' : ' · Inactivo'}`,
            badge: String(districtMeetings(d)),
            selected: selD.value === d.id,
        })),
    })

    // Zonas
    const dist = selDist.value
    const zItems = dist ? zonesOf(dist.id).filter((z) => matches(z.name, z.code)) : []
    cols.push({
        level: 'zona',
        label: 'Zonas',
        accent: LEVEL_ACCENT.zona,
        count: dist ? zonesOf(dist.id).length : 0,
        canAdd: canManage.value && !!dist,
        addTitle: 'Agregar zona',
        hint: dist ? null : 'Selecciona un distrito para ver sus zonas.',
        empty:
            dist && zItems.length === 0
                ? zonesOf(dist.id).length
                    ? 'Sin resultados'
                    : 'Este distrito no tiene zonas.'
                : null,
        items: zItems.map((z) => ({
            id: z.id,
            level: 'zona',
            name: z.name,
            code: z.code,
            color: z.color,
            sub: `${plural(sectorsOf(z.id).length, 'sector', 'sectores')}${z.isActive ? '' : ' · Inactivo'}`,
            badge: String(zoneMeetings(z)),
            selected: selZ.value === z.id,
        })),
    })

    // Sectores
    const zone = selZone.value
    const sItems = zone ? sectorsOf(zone.id).filter((s) => matches(s.name, s.code)) : []
    cols.push({
        level: 'sector',
        label: 'Sectores',
        accent: LEVEL_ACCENT.sector,
        count: zone ? sectorsOf(zone.id).length : 0,
        canAdd: canManage.value && !!zone,
        addTitle: 'Agregar sector',
        hint: zone ? null : 'Selecciona una zona para ver sus sectores.',
        empty:
            zone && sItems.length === 0
                ? sectorsOf(zone.id).length
                    ? 'Sin resultados'
                    : 'Esta zona no tiene sectores.'
                : null,
        items: sItems.map((s) => ({
            id: s.id,
            level: 'sector',
            name: s.name,
            code: s.code,
            color: s.color,
            sub: `${plural(meetingsOf(s.id).length, 'reunión', 'reuniones')}${s.isActive ? '' : ' · Inactivo'}`,
            badge: String(meetingsOf(s.id).length),
            selected: selS.value === s.id,
        })),
    })

    // Reuniones
    const sector = selSector.value
    const mItems = sector ? meetingsOf(sector.id).filter((m) => matches(m.title)) : []
    cols.push({
        level: 'reunion',
        label: 'Reuniones',
        accent: LEVEL_ACCENT.reunion,
        count: sector ? meetingsOf(sector.id).length : 0,
        canAdd: canManageMeetings.value && !!sector,
        addTitle: 'Asignar reunión',
        hint: sector ? null : 'Selecciona un sector para ver sus reuniones.',
        empty:
            sector && mItems.length === 0
                ? meetingsOf(sector.id).length
                    ? 'Sin resultados'
                    : 'Este sector no tiene reuniones. Usa + para asignar una.'
                : null,
        items: mItems.map((m) => ({
            id: String(m.id),
            level: 'reunion',
            name: m.title,
            code: m.code,
            color: m.color,
            sub: `${meetingDay(m)} · ${fmtTime(m.startTime)}`,
            badge: String(m.expectedAttendees),
            selected: selM.value === String(m.id),
        })),
    })

    return cols
})

// ===== totals & breadcrumb =====
const totals = computed(() => ({
    d: districts.value.length,
    z: zones.value.length,
    s: sectors.value.length,
    m: meetings.value.length,
}))

const crumbs = computed(() => {
    const list: { name: string; level: Level; id: string }[] = []
    if (selDist.value)
        list.push({ name: selDist.value.name, level: 'distrito', id: selDist.value.id })
    if (selZone.value) list.push({ name: selZone.value.name, level: 'zona', id: selZone.value.id })
    if (selSector.value)
        list.push({ name: selSector.value.name, level: 'sector', id: selSector.value.id })
    if (selM.value && selSector.value) {
        const m = meetingsOf(selSector.value.id).find((x) => String(x.id) === selM.value)
        if (m) list.push({ name: m.title, level: 'reunion', id: String(m.id) })
    }
    return list
})

// ===== selection =====
function select(level: Level, id: string) {
    closeMenu()
    if (level === 'distrito') {
        selD.value = id
        selZ.value = null
        selS.value = null
        selM.value = null
    } else if (level === 'zona') {
        selZ.value = id
        selS.value = null
        selM.value = null
    } else if (level === 'sector') {
        selS.value = id
        selM.value = null
    } else {
        selM.value = id
        drawer.value = { level: 'reunion', id }
    }
}

function clearSelection() {
    selD.value = null
    selZ.value = null
    selS.value = null
    selM.value = null
    drawer.value = null
}

// ===== context menu =====
function openMenu(level: Level, id: string, event: MouseEvent) {
    event.stopPropagation()
    if (menuFor.value === id) {
        closeMenu()
        return
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    menuPos.left = Math.max(12, rect.right - 208)
    menuPos.top = rect.bottom + 6
    menuFor.value = id
    menuLevel.value = level
    menuMode.value = 'normal'
}
function closeMenu() {
    menuFor.value = null
    menuLevel.value = null
    menuMode.value = 'normal'
}

const canMove = computed(
    () =>
        menuLevel.value !== null &&
        menuLevel.value !== 'distrito' &&
        (menuLevel.value === 'reunion' ? canManageMeetings.value : canManage.value),
)

const menuName = computed(() => {
    if (!menuFor.value || !menuLevel.value) return ''
    return findEntity(menuLevel.value, menuFor.value)?.name ?? ''
})

// ===== detail drawer =====
function openDetail(level: Level, id: string) {
    drawer.value = { level, id }
    closeMenu()
}
function closeDrawer() {
    drawer.value = null
}

interface DetailField {
    label: string
    value: string
}
interface EntityLike {
    name: string
}

function findDistrict(id: string) {
    return districts.value.find((d) => d.id === id) ?? null
}
function findEntity(level: Level, id: string): EntityLike | null {
    if (level === 'distrito') return findDistrict(id)
    if (level === 'zona') return zones.value.find((z) => z.id === id) ?? null
    if (level === 'sector') return sectors.value.find((s) => s.id === id) ?? null
    const m = meetings.value.find((x) => String(x.id) === id)
    return m ? { name: m.title } : null
}
function zoneParent(zoneId: string) {
    const z = zones.value.find((x) => x.id === zoneId)
    return z ? findDistrict(z.districtId) : null
}
function sectorParent(sectorId: string) {
    const s = sectors.value.find((x) => x.id === sectorId)
    if (!s) return null
    const z = zones.value.find((x) => x.id === s.zoneId)
    const d = z ? findDistrict(z.districtId) : null
    return { sector: s, zone: z ?? null, district: d }
}
function meetingParent(meetingId: string) {
    const m = meetings.value.find((x) => String(x.id) === meetingId)
    if (!m) return null
    return {
        meeting: m,
        ...(sectorParent(String(m.sectorId)) ?? { sector: null, zone: null, district: null }),
    }
}

const detail = computed(() => {
    if (!drawer.value) return null
    const { level, id } = drawer.value

    if (level === 'distrito') {
        const d = findDistrict(id)
        if (!d) return null
        const fields: DetailField[] = [
            { label: 'Pastor', value: d.leaderName || '—' },
            { label: 'Estado', value: d.isActive ? 'Activo' : 'Inactivo' },
            { label: 'Código', value: d.code },
            { label: 'Zonas', value: String(zonesOf(d.id).length) },
            { label: 'Sectores', value: String(districtSectors(d)) },
            { label: 'Reuniones', value: String(districtMeetings(d)) },
            { label: 'Creado', value: new Date(d.createdAt).getFullYear().toString() },
        ]
        if (d.description) fields.push({ label: 'Descripción', value: d.description })
        return {
            level,
            levelLabel: LEVEL_LABEL.distrito,
            accent: LEVEL_ACCENT.distrito,
            name: d.name,
            fields,
        }
    }

    if (level === 'zona') {
        const z = zones.value.find((x) => x.id === id)
        if (!z) return null
        const parent = zoneParent(z.id)
        const fields: DetailField[] = [
            { label: 'Líder', value: z.leaderName || '—' },
            { label: 'Estado', value: z.isActive ? 'Activo' : 'Inactivo' },
            { label: 'Distrito', value: parent?.name ?? '—' },
            { label: 'Código', value: z.code },
            { label: 'Sectores', value: String(sectorsOf(z.id).length) },
            { label: 'Reuniones', value: String(zoneMeetings(z)) },
        ]
        return {
            level,
            levelLabel: LEVEL_LABEL.zona,
            accent: LEVEL_ACCENT.zona,
            name: z.name,
            fields,
        }
    }

    if (level === 'sector') {
        const parent = sectorParent(id)
        if (!parent?.sector) return null
        const s = parent.sector
        const fields: DetailField[] = [
            { label: 'Supervisor', value: s.supervisorName || '—' },
            { label: 'Estado', value: s.isActive ? 'Activo' : 'Inactivo' },
            { label: 'Zona', value: parent.zone?.name ?? '—' },
            { label: 'Distrito', value: parent.district?.name ?? '—' },
            { label: 'Código', value: s.code },
            { label: 'Reuniones', value: String(meetingsOf(s.id).length) },
        ]
        return {
            level,
            levelLabel: LEVEL_LABEL.sector,
            accent: LEVEL_ACCENT.sector,
            name: s.name,
            fields,
        }
    }

    const parent = meetingParent(id)
    if (!parent?.meeting) return null
    const m = parent.meeting
    const fields: DetailField[] = [
        { label: 'Tipo', value: m.typeName ?? '—' },
        { label: 'Supervisor', value: m.supervisorName ?? '—' },
        { label: 'Día', value: meetingDay(m) },
        { label: 'Hora', value: `${fmtTime(m.startTime)} – ${fmtTime(m.endTime)}` },
        { label: 'Ubicación', value: m.location || '—' },
        { label: 'Frecuencia', value: getMeetingFrequencyLabel(m.frequency) },
        { label: 'Estado', value: m.isActive ? 'Activa' : 'Inactiva' },
        { label: 'Asistentes', value: String(m.expectedAttendees) },
        { label: 'Sector', value: parent.sector?.name ?? '—' },
        { label: 'Zona', value: parent.zone?.name ?? '—' },
    ]
    return {
        level,
        levelLabel: LEVEL_LABEL.reunion,
        accent: LEVEL_ACCENT.reunion,
        name: m.title,
        fields,
    }
})

// ===== move =====
interface MoveTarget {
    id: string
    name: string
}
const moveTargets = computed<MoveTarget[]>(() => {
    if (!menuFor.value || !menuLevel.value) return []
    const level = menuLevel.value
    const id = menuFor.value
    if (level === 'zona') {
        const parent = zoneParent(id)
        return districts.value
            .filter((d) => !parent || d.id !== parent.id)
            .map((d) => ({ id: d.id, name: d.name }))
    }
    if (level === 'sector') {
        const parent = sectorParent(id)
        const targets: MoveTarget[] = []
        districts.value.forEach((d) =>
            zonesOf(d.id).forEach((z) => {
                if (!parent?.zone || z.id !== parent.zone.id)
                    targets.push({ id: z.id, name: `${d.name} · ${z.name}` })
            }),
        )
        return targets
    }
    if (level === 'reunion') {
        const parent = meetingParent(id)
        const targets: MoveTarget[] = []
        zones.value.forEach((z) =>
            sectorsOf(z.id).forEach((s) => {
                if (!parent?.sector || s.id !== parent.sector.id)
                    targets.push({ id: s.id, name: `${z.name} · ${s.name}` })
            }),
        )
        return targets
    }
    return []
})

async function moveEntity(targetId: string) {
    if (!menuFor.value || !menuLevel.value) return
    const level = menuLevel.value
    const id = menuFor.value
    if (level === 'reunion' ? !canManageMeetings.value : !canManage.value) return
    try {
        if (level === 'zona') {
            await updateTerritoryMutation.mutateAsync({
                level: 'zona',
                id,
                input: { parentId: targetId },
            })
            selD.value = targetId
            selZ.value = id
        } else if (level === 'sector') {
            await updateTerritoryMutation.mutateAsync({
                level: 'sector',
                id,
                input: { parentId: targetId },
            })
            const zone = zones.value.find((item) => item.id === targetId)
            selD.value = zone?.districtId ?? selD.value
            selZ.value = targetId
            selS.value = id
        } else if (level === 'reunion') {
            const meeting = meetings.value.find((item) => String(item.id) === id)
            if (!meeting) throw new Error('La reunión seleccionada ya no está disponible.')
            await updateMeetingMutation.mutateAsync({
                id: meeting.id,
                input: { sectorId: Number(targetId) },
            })

            const targetSector = sectors.value.find((item) => item.id === targetId)
            const targetZone = targetSector
                ? zones.value.find((item) => item.id === targetSector.zoneId)
                : null
            selD.value = targetZone?.districtId ?? selD.value
            selZ.value = targetSector?.zoneId ?? selZ.value
            selS.value = targetId
            selM.value = id
        }
        closeMenu()
        toast.success(`${LEVEL_LABEL[level]} movido`)
    } catch (error) {
        toast.error(
            requestErrorMessage(
                error,
                `No fue posible mover el ${LEVEL_LABEL[level].toLowerCase()}.`,
            ),
        )
    }
}

// ===== delete (district/zone/sector) =====
async function removeEntity() {
    if (!canManage.value || !menuFor.value || !menuLevel.value) return
    const level = menuLevel.value
    const id = menuFor.value
    if (level === 'reunion') return

    try {
        await deleteTerritoryMutation.mutateAsync({ level, id })
        if (level === 'distrito' && selD.value === id) clearSelection()
        if (level === 'zona' && selZ.value === id) {
            selZ.value = null
            selS.value = null
            selM.value = null
        }
        if (level === 'sector' && selS.value === id) {
            selS.value = null
            selM.value = null
        }
        if (drawer.value?.id === id) drawer.value = null
        closeMenu()
        toast.success(`${LEVEL_LABEL[level]} eliminado`)
    } catch (error) {
        toast.error(
            requestErrorMessage(
                error,
                `No fue posible eliminar el ${LEVEL_LABEL[level].toLowerCase()}.`,
            ),
        )
    }
}

// ===== reunion actions =====
function goToMeeting(id: string) {
    closeMenu()
    navigateTo(`/catalogos/reuniones/${id}/editar`)
}

function goToOfferingRegistration(id: string) {
    closeMenu()
    closeDrawer()
    navigateTo({
        path: '/finanzas/ofrendas/nueva',
        query: { meetingId: id },
    })
}

// ===== entity form (create/edit) =====
function toEntityInput(e: District | Zone | TerritorySector): TerritoryInput {
    const sector = 'supervisorId' in e ? e : null
    return {
        name: e.name,
        code: e.code,
        leaderName: e.leaderName,
        description: e.description,
        color: e.color,
        polygon: e.polygon,
        isActive: e.isActive,
        supervisorId: sector?.supervisorId ?? null,
    }
}

function openCreate(level: EntityLevel) {
    if (!canManage.value) return
    closeMenu()
    formMode.value = 'create'
    formLevel.value = level
    formEntity.value = null
    formEditId = null
    formParentDistrictId = null
    formParentZoneId = null

    if (level === 'distrito') {
        formParentCentroid.value = EL_SALVADOR_CENTER
        formParentLabel.value = null
    } else if (level === 'zona') {
        const d = selDist.value
        if (!d) return
        formParentDistrictId = d.id
        formParentCentroid.value = centroid(d.polygon)
        formParentLabel.value = d.name
    } else {
        const z = selZone.value
        const d = selDist.value
        if (!z) return
        formParentZoneId = z.id
        formParentCentroid.value = centroid(z.polygon)
        formParentLabel.value = d ? `${d.name} · ${z.name}` : z.name
    }
    formOpen.value = true
}

function editFromMenu() {
    const level = menuLevel.value
    const id = menuFor.value
    if (!level || !id || level === 'reunion') return
    openEdit(level, id)
}

function openEdit(level: EntityLevel, id: string) {
    if (!canManage.value) return
    closeMenu()
    let entity: District | Zone | TerritorySector | undefined
    let parentLabel: string | null = null
    if (level === 'distrito') {
        entity = districts.value.find((d) => d.id === id)
    } else if (level === 'zona') {
        entity = zones.value.find((z) => z.id === id)
        parentLabel = entity ? (zoneParent(entity.id)?.name ?? null) : null
    } else {
        entity = sectors.value.find((s) => s.id === id)
        const p = entity ? sectorParent(entity.id) : null
        parentLabel = p ? `${p.district?.name ?? '—'} · ${p.zone?.name ?? '—'}` : null
    }
    if (!entity) return

    formMode.value = 'edit'
    formLevel.value = level
    formEditId = id
    formEntity.value = toEntityInput(entity)
    formParentCentroid.value = centroid(entity.polygon)
    formParentLabel.value = parentLabel
    formOpen.value = true
}

async function onFormSave(payload: TerritoryInput) {
    const level = formLevel.value
    if (!canManage.value) return

    try {
        if (formMode.value === 'create') {
            const parentId =
                level === 'zona'
                    ? formParentDistrictId
                    : level === 'sector'
                      ? formParentZoneId
                      : null
            const created = await createTerritoryMutation.mutateAsync({
                level,
                input: payload,
                parentId,
            })
            if (level === 'distrito') {
                selD.value = created.id
                selZ.value = null
                selS.value = null
                selM.value = null
            } else if (level === 'zona') {
                selZ.value = created.id
                selS.value = null
                selM.value = null
            } else {
                selS.value = created.id
                selM.value = null
            }
            toast.success(`${LEVEL_LABEL[level]} creado`)
        } else if (formEditId) {
            await updateTerritoryMutation.mutateAsync({
                level,
                id: formEditId,
                input: payload,
            })
            toast.success('Cambios guardados')
        }

        formOpen.value = false
    } catch (error) {
        toast.error(
            requestErrorMessage(
                error,
                `No fue posible guardar el ${LEVEL_LABEL[level].toLowerCase()}.`,
            ),
        )
    }
}

// ===== assign meetings =====
interface AssignItem {
    id: string
    title: string
    meta: string
    color: string
    assigned: boolean
}
const assignItems = computed<AssignItem[]>(() => {
    const sector = selSector.value
    if (!sector) return []
    return meetings.value.map((m) => ({
        id: String(m.id),
        title: m.title,
        color: m.color,
        meta: `${sectorLabelOf(String(m.sectorId))} · ${meetingDay(m)} ${fmtTime(m.startTime)}`,
        assigned: String(m.sectorId) === sector.id,
    }))
})

function openAssign() {
    closeMenu()
    if (!canManageMeetings.value || !selSector.value) return
    assignOpen.value = true
}
async function assignMeeting(id: string) {
    const sector = selSector.value
    if (!sector) return
    const meeting = meetings.value.find((item) => String(item.id) === id)
    if (!meeting) return

    try {
        await updateMeetingMutation.mutateAsync({
            id: meeting.id,
            input: { sectorId: Number(sector.id) },
        })
        toast.success('Reunión asignada')
    } catch (error) {
        toast.error(requestErrorMessage(error, 'No fue posible asignar la reunión.'))
    }
}

function onColumnAdd(level: Level) {
    if (level === 'reunion') {
        openAssign()
        return
    }
    if (canManage.value) openCreate(level)
}

// ===== locator map (Leaflet, detail drawer) =====
const mapEl = ref<HTMLElement | null>(null)
let map: import('leaflet').Map | null = null
let L: typeof import('leaflet') | null = null
let mapGeneration = 0
let isUnmounted = false

function polygonFor(level: Level, id: string): Polygon | null {
    if (level === 'distrito') return findDistrict(id)?.polygon ?? null
    if (level === 'zona') return zones.value.find((z) => z.id === id)?.polygon ?? null
    if (level === 'sector') return sectors.value.find((s) => s.id === id)?.polygon ?? null
    const parent = meetingParent(id)
    return parent?.sector?.polygon ?? null
}

function removeMap() {
    if (map) {
        map.remove()
        map = null
    }
}

function destroyMap() {
    mapGeneration += 1
    removeMap()
}

async function renderMap() {
    if (!import.meta.client || isUnmounted || !drawer.value) return
    const generation = ++mapGeneration
    const { level, id } = drawer.value
    const drawerKey = `${level}:${id}`

    // A meeting shows a single point: its saved position, or its sector's centroid as a fallback.
    const meetingPoint =
        level === 'reunion'
            ? (() => {
                  const meeting = meetings.value.find((item) => String(item.id) === id)
                  if (meeting && meeting.latitude !== null && meeting.longitude !== null) {
                      return [meeting.latitude, meeting.longitude] as LatLng
                  }
                  const poly = polygonFor(level, id)
                  return poly && poly.length ? centroid(poly) : null
              })()
            : null

    const polygon = polygonFor(level, id)
    if (level !== 'reunion' && (!polygon || polygon.length === 0)) {
        destroyMap()
        return
    }
    if (level === 'reunion' && !meetingPoint) {
        destroyMap()
        return
    }
    if (!L) {
        const leafletModule = await import('leaflet')
        L = leafletModule.default ?? leafletModule
    }

    await nextTick()
    const container = mapEl.value
    const currentDrawerKey = drawer.value ? `${drawer.value.level}:${drawer.value.id}` : ''
    if (
        isUnmounted ||
        generation !== mapGeneration ||
        drawerKey !== currentDrawerKey ||
        !container?.isConnected ||
        !L
    ) {
        return
    }

    removeMap()

    const accent = detail.value?.accent ?? '#e9c176'
    map = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
    })
    map.zoomControl.setPosition('topright')
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map)

    if (level === 'reunion') {
        const point = meetingPoint!
        map.setView(point, 15)
        L.circleMarker(point, {
            radius: 9,
            color: accent,
            weight: 2,
            fillColor: accent,
            fillOpacity: 0.45,
        }).addTo(map)
    } else {
        const shape = L.polygon(polygon!, {
            color: accent,
            weight: 2,
            fillColor: accent,
            fillOpacity: 0.12,
            dashArray: '5 5',
        }).addTo(map)
        map.fitBounds(shape.getBounds(), { padding: [22, 22] })
    }
    const current = map
    setTimeout(() => {
        if (
            !isUnmounted &&
            generation === mapGeneration &&
            map === current &&
            container.isConnected
        ) {
            current.invalidateSize()
        }
    }, 60)
}

watch(
    () => (drawer.value ? `${drawer.value.level}:${drawer.value.id}` : ''),
    (key) => {
        if (!key) {
            destroyMap()
            return
        }
        renderMap()
    },
)

onBeforeUnmount(() => {
    isUnmounted = true
    destroyMap()
})
</script>

<template>
    <div class="flex h-screen flex-col bg-surface-container-lowest pt-[72px]">
        <!-- Toolbar: breadcrumb, totals, search -->
        <div
            class="flex flex-none flex-col gap-3 border-b border-outline-variant bg-surface-container px-6 py-3.5 lg:flex-row lg:items-center lg:px-10"
        >
            <div>
                <p
                    class="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
                >
                    Gestión de jerarquía
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <button
                        type="button"
                        class="font-semibold text-primary hover:underline"
                        @click="clearSelection"
                    >
                        Jerarquía
                    </button>
                    <template v-for="c in crumbs" :key="c.id">
                        <span class="text-outline">/</span>
                        <button
                            type="button"
                            class="text-on-surface hover:text-primary"
                            @click="select(c.level, c.id)"
                        >
                            {{ c.name }}
                        </button>
                    </template>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 lg:ml-auto">
                <div class="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span
                        ><strong class="font-semibold text-on-surface">{{ totals.d }}</strong>
                        distritos</span
                    >
                    <span
                        ><strong class="font-semibold text-on-surface">{{ totals.z }}</strong>
                        zonas</span
                    >
                    <span
                        ><strong class="font-semibold text-on-surface">{{ totals.s }}</strong>
                        sectores</span
                    >
                    <span
                        ><strong class="font-semibold text-on-surface">{{ totals.m }}</strong>
                        reuniones</span
                    >
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <input
                        v-if="canManage"
                        ref="importInput"
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        class="hidden"
                        @change="onImportFile"
                    />
                    <UiButton
                        v-if="canManage"
                        variant="outline"
                        size="sm"
                        type="button"
                        :loading="downloadingTemplate"
                        :disabled="supervisorsQuery.isPending.value"
                        @click="downloadTemplate"
                    >
                        <FileDown class="size-4" />
                        Plantilla
                    </UiButton>
                    <UiButton
                        v-if="canManage"
                        variant="outline"
                        size="sm"
                        type="button"
                        :loading="parsingImportFile"
                        :disabled="catalogLoading"
                        @click="pickImportFile"
                    >
                        <Upload class="size-4" />
                        Importar
                    </UiButton>
                    <UiButton
                        variant="outline"
                        size="sm"
                        type="button"
                        :loading="exporting"
                        :disabled="catalogLoading || !hierarchyQuery.data.value"
                        @click="exportExcel"
                    >
                        <Download class="size-4" />
                        Exportar
                    </UiButton>
                </div>
                <div
                    class="flex items-center gap-2 rounded-full border border-outline-variant bg-surface px-4 py-2 sm:w-72"
                >
                    <Search class="size-4 shrink-0 text-on-surface-variant" />
                    <input
                        v-model="query"
                        type="text"
                        placeholder="Buscar distrito, zona, sector…"
                        class="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                    />
                    <button
                        v-if="query"
                        type="button"
                        class="shrink-0 text-on-surface-variant hover:text-on-surface"
                        aria-label="Limpiar búsqueda"
                        @click="query = ''"
                    >
                        <X class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>

        <div
            v-if="catalogLoading"
            class="flex min-h-0 flex-1 items-center justify-center gap-3 bg-surface text-sm text-on-surface-variant"
        >
            <LoaderCircle class="size-5 animate-spin text-primary" />
            Cargando distritos, zonas, sectores y reuniones…
        </div>

        <div
            v-else-if="catalogError"
            class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface px-6 py-10"
            role="alert"
            aria-live="polite"
        >
            <div
                class="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl"
            />
            <div
                class="pointer-events-none absolute -right-24 bottom-0 size-64 rounded-full bg-amber-400/10 blur-3xl"
            />

            <div
                class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low/95 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.45)]"
            >
                <div class="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-amber-400" />

                <div class="px-7 py-8 text-center sm:px-10 sm:py-10">
                    <div class="relative mx-auto w-fit">
                        <div
                            class="flex size-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm"
                        >
                            <MapPinned class="size-8" stroke-width="1.8" />
                        </div>
                        <span
                            class="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-4 border-surface-container-low bg-amber-400 text-slate-950"
                        >
                            <AlertTriangle class="size-3.5" stroke-width="2.5" />
                        </span>
                    </div>

                    <p class="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                        Catálogo territorial
                    </p>
                    <h2
                        class="mt-2 font-display text-2xl font-semibold tracking-tight text-on-surface"
                    >
                        No pudimos cargar el catálogo territorial
                    </h2>
                    <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">
                        Parece una interrupción temporal. Revisa tu conexión o vuelve a intentarlo
                        en unos segundos.
                    </p>

                    <div
                        class="mt-6 rounded-2xl border border-outline-variant/80 bg-surface-container px-4 py-3 text-left"
                    >
                        <p
                            class="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
                        >
                            Detalle del problema
                        </p>
                        <p class="mt-1 text-sm leading-5 text-on-surface">
                            {{ catalogError }}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="group mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
                        @click="retryCatalog"
                    >
                        <RefreshCw
                            class="size-4 transition-transform duration-300 group-hover:rotate-45"
                        />
                        Volver a intentar
                    </button>

                    <p class="mt-4 text-xs text-on-surface-variant">
                        Tus datos no fueron modificados.
                    </p>
                </div>
            </div>
        </div>

        <!-- Miller columns -->
        <main v-else class="flex min-h-0 flex-1 overflow-x-auto bg-surface">
            <section
                v-for="col in columns"
                :key="col.level"
                class="flex min-w-[240px] flex-1 flex-col border-r border-outline-variant last:border-r-0"
            >
                <header
                    class="flex flex-none items-center justify-between border-b border-outline-variant px-4 py-2.5"
                >
                    <div class="flex items-center gap-2">
                        <span
                            class="text-[11px] font-bold uppercase tracking-[0.16em]"
                            :style="{ color: col.accent }"
                        >
                            {{ col.label }}
                        </span>
                        <span
                            class="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant"
                        >
                            {{ col.count }}
                        </span>
                    </div>
                    <button
                        v-if="col.canAdd"
                        type="button"
                        class="flex size-7 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                        :title="col.addTitle"
                        :aria-label="col.addTitle"
                        @click="onColumnAdd(col.level)"
                    >
                        <Plus class="size-4" />
                    </button>
                </header>

                <div class="min-h-0 flex-1 overflow-y-auto">
                    <p
                        v-if="col.hint"
                        class="px-5 py-10 text-center text-sm leading-relaxed text-on-surface-variant"
                    >
                        {{ col.hint }}
                    </p>
                    <p
                        v-else-if="col.empty"
                        class="px-5 py-10 text-center text-sm italic text-on-surface-variant"
                    >
                        {{ col.empty }}
                    </p>

                    <button
                        v-for="it in col.items"
                        :key="it.id"
                        type="button"
                        class="group relative flex w-full items-center gap-3 border-b border-outline-variant/50 px-4 py-3 text-left transition-colors hover:bg-surface-container-high"
                        :class="it.selected ? 'bg-primary/10' : ''"
                        @click="select(it.level, it.id)"
                    >
                        <span
                            v-if="it.selected"
                            class="absolute inset-y-0 left-0 w-[3px] bg-primary"
                        />
                        <span
                            class="size-2.5 shrink-0 rounded-full"
                            :style="{ backgroundColor: it.color }"
                        />
                        <span class="min-w-0 flex-1">
                            <span
                                class="block truncate font-mono text-[10px] uppercase tracking-wider text-on-surface-variant/70"
                                >{{ it.code }}</span
                            >
                            <span class="block truncate text-sm font-semibold text-on-surface">{{
                                it.name
                            }}</span>
                            <span class="mt-0.5 block truncate text-xs text-on-surface-variant">{{
                                it.sub
                            }}</span>
                        </span>
                        <span
                            class="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant"
                        >
                            {{ it.badge }}
                        </span>
                        <span
                            class="flex size-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
                            role="button"
                            :aria-label="`Acciones de ${it.name}`"
                            @click="openMenu(it.level, it.id, $event)"
                        >
                            <MoreHorizontal class="size-4" />
                        </span>
                    </button>
                </div>
            </section>
        </main>

        <!-- Context menu -->
        <template v-if="menuFor">
            <div class="fixed inset-0 z-40" @click="closeMenu" />
            <div
                class="fixed z-50 w-52 rounded-xl border border-outline-variant bg-surface-container p-1.5 shadow-2xl"
                :style="{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }"
                @click.stop
            >
                <template v-if="menuMode === 'normal'">
                    <button
                        type="button"
                        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                        @click="openDetail(menuLevel!, menuFor!)"
                    >
                        Ver detalle
                    </button>
                    <button
                        v-if="canManage && menuLevel !== 'reunion'"
                        type="button"
                        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                        @click="editFromMenu"
                    >
                        Editar
                    </button>
                    <button
                        v-if="menuLevel === 'reunion'"
                        type="button"
                        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                        @click="goToMeeting(menuFor!)"
                    >
                        Ir a reunión
                        <ExternalLink class="size-3.5 text-on-surface-variant" />
                    </button>
                    <button
                        v-if="canMove"
                        type="button"
                        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                        @click="menuMode = 'move'"
                    >
                        Mover a…
                    </button>
                    <button
                        v-if="canManage && menuLevel !== 'reunion'"
                        type="button"
                        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                        @click="menuMode = 'confirm'"
                    >
                        Eliminar
                    </button>
                </template>

                <template v-else-if="menuMode === 'confirm'">
                    <p class="px-3 py-2 text-sm leading-snug text-on-surface-variant">
                        ¿Eliminar <strong class="text-on-surface">{{ menuName }}</strong
                        >?
                    </p>
                    <div class="flex gap-1.5 p-1">
                        <button
                            type="button"
                            class="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-white hover:bg-destructive/90"
                            :disabled="hierarchySaving"
                            @click="removeEntity"
                        >
                            Eliminar
                        </button>
                        <button
                            type="button"
                            class="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high"
                            @click="menuMode = 'normal'"
                        >
                            Cancelar
                        </button>
                    </div>
                </template>

                <template v-else>
                    <p
                        class="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant"
                    >
                        Mover a…
                    </p>
                    <div class="max-h-52 overflow-y-auto">
                        <button
                            v-for="t in moveTargets"
                            :key="t.id"
                            type="button"
                            class="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                            @click="moveEntity(t.id)"
                        >
                            {{ t.name }}
                        </button>
                        <p
                            v-if="moveTargets.length === 0"
                            class="px-3 py-2 text-sm italic text-on-surface-variant"
                        >
                            No hay destinos disponibles.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="block w-full rounded-lg px-3 py-2 text-left text-sm text-on-surface-variant hover:bg-surface-container-high"
                        @click="menuMode = 'normal'"
                    >
                        Cancelar
                    </button>
                </template>
            </div>
        </template>

        <!-- Detail drawer -->
        <template v-if="drawer && detail">
            <div class="fixed inset-0 z-40 bg-black/50" @click="closeDrawer" />
            <aside
                class="hierarchy-drawer fixed inset-y-0 right-0 z-50 flex w-[430px] max-w-[92vw] flex-col bg-surface-container-low shadow-2xl"
            >
                <div class="flex-none border-b border-outline-variant px-6 py-5">
                    <div class="flex items-center justify-between">
                        <span
                            class="text-[11px] font-bold uppercase tracking-[0.2em]"
                            :style="{ color: detail.accent }"
                        >
                            {{ detail.levelLabel }}
                        </span>
                        <button
                            type="button"
                            class="text-on-surface-variant hover:text-on-surface"
                            aria-label="Cerrar detalle"
                            @click="closeDrawer"
                        >
                            <X class="size-4" />
                        </button>
                    </div>
                    <h2 class="mt-1.5 font-display text-2xl font-semibold text-on-surface">
                        {{ detail.name }}
                    </h2>
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto">
                    <div class="px-6 pt-5">
                        <p
                            class="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
                        >
                            Ubicación
                        </p>
                        <div
                            ref="mapEl"
                            class="hierarchy-map h-44 w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container"
                        />
                    </div>
                    <dl class="px-6 pb-8 pt-2">
                        <div
                            v-for="f in detail.fields"
                            :key="f.label"
                            class="flex justify-between gap-5 border-b border-outline-variant/60 py-3.5"
                        >
                            <dt class="flex-none text-sm text-on-surface-variant">
                                {{ f.label }}
                            </dt>
                            <dd class="text-right text-sm font-medium text-on-surface">
                                {{ f.value }}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div
                    v-if="drawer.level === 'reunion'"
                    class="flex-none space-y-2 border-t border-outline-variant px-6 py-4"
                >
                    <button
                        v-if="canManageOfferings"
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        @click="goToOfferingRegistration(drawer.id)"
                    >
                        <HandCoins class="size-4" /> Registrar asistencia y ofrendas
                    </button>
                    <button
                        type="button"
                        class="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                        @click="goToMeeting(drawer.id)"
                    >
                        <ExternalLink class="size-4" /> Ir a la reunión
                    </button>
                </div>
            </aside>
        </template>

        <DialogRoot v-model:open="importOpen">
            <DialogPortal>
                <DialogOverlay class="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
                <DialogContent
                    class="fixed left-1/2 top-1/2 z-[71] max-h-[88vh] w-[96vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl focus:outline-none sm:p-7"
                >
                    <div class="flex items-start gap-4">
                        <div
                            class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                        >
                            <FileSpreadsheet class="size-6" />
                        </div>
                        <div class="min-w-0">
                            <DialogTitle class="font-display text-xl font-semibold text-on-surface">
                                Importar distritos, zonas y sectores
                            </DialogTitle>
                            <DialogDescription
                                class="mt-1 truncate text-sm text-on-surface-variant"
                            >
                                {{ importFileName }}
                            </DialogDescription>
                        </div>
                    </div>

                    <div v-if="importResult" class="mt-6 grid gap-3 sm:grid-cols-4">
                        <div class="rounded-xl border border-primary/25 bg-primary/5 p-4">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Distritos
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-primary">
                                {{ importResult.createdDistricts }}
                            </p>
                        </div>
                        <div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Zonas
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-amber-600">
                                {{ importResult.createdZones }}
                            </p>
                        </div>
                        <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Sectores
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-emerald-600">
                                {{ importResult.createdSectors }}
                            </p>
                        </div>
                        <div
                            class="rounded-xl border p-4"
                            :class="
                                retryImportFailures.length
                                    ? 'border-destructive/35 bg-destructive/5'
                                    : 'border-outline-variant bg-surface-container'
                            "
                        >
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Pendientes
                            </p>
                            <p
                                class="mt-1 font-display text-2xl font-semibold"
                                :class="
                                    retryImportFailures.length
                                        ? 'text-destructive'
                                        : 'text-on-surface'
                                "
                            >
                                {{ retryImportFailures.length }}
                            </p>
                        </div>
                    </div>

                    <div v-else class="mt-6 grid gap-3 sm:grid-cols-4">
                        <div
                            v-for="summary in [
                                {
                                    label: 'Distritos válidos',
                                    value: importPreview.districts.filter(
                                        (row) => !row.issues.length,
                                    ).length,
                                },
                                {
                                    label: 'Zonas válidas',
                                    value: importPreview.zones.filter((row) => !row.issues.length)
                                        .length,
                                },
                                {
                                    label: 'Sectores válidos',
                                    value: importPreview.sectors.filter((row) => !row.issues.length)
                                        .length,
                                },
                            ]"
                            :key="summary.label"
                            class="rounded-xl border border-outline-variant bg-surface-container p-4"
                        >
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                {{ summary.label }}
                            </p>
                            <p class="mt-1 font-display text-2xl font-semibold text-on-surface">
                                {{ summary.value }}
                            </p>
                        </div>
                        <div
                            class="rounded-xl border p-4"
                            :class="
                                importErrors.length
                                    ? 'border-destructive/35 bg-destructive/5'
                                    : 'border-outline-variant bg-surface-container'
                            "
                        >
                            <p
                                class="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
                            >
                                Filas con errores
                            </p>
                            <p
                                class="mt-1 font-display text-2xl font-semibold"
                                :class="
                                    importErrors.length ? 'text-destructive' : 'text-on-surface'
                                "
                            >
                                {{ invalidImportRows.length }}
                            </p>
                        </div>
                    </div>

                    <div
                        v-if="importErrors.length"
                        class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                    >
                        <p class="text-xs font-semibold text-destructive">
                            {{
                                importResult
                                    ? 'Registros que continúan pendientes:'
                                    : 'Corrige estas filas o importa únicamente las válidas:'
                            }}
                        </p>
                        <ul
                            class="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-xs leading-5 text-on-surface-variant"
                        >
                            <li v-for="error in importErrors" :key="error">
                                {{ error }}
                            </li>
                        </ul>
                    </div>

                    <p
                        v-else-if="!importResult"
                        class="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Se crearán primero los distritos, después las zonas y finalmente los
                        sectores. Las reuniones no se modifican. Las referencias de la plantilla
                        solo sirven para enlazar las filas y el sistema generará los códigos
                        definitivos.
                    </p>

                    <p
                        v-if="importResult && retryImportFailures.length"
                        class="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-on-surface-variant"
                    >
                        Los {{ importedTotal }} registros creados ya no aparecen en el Excel de
                        pendientes. Corrige ese archivo y vuelve a importarlo.
                    </p>

                    <div class="mt-6 flex flex-wrap justify-end gap-2">
                        <DialogClose as-child>
                            <UiButton variant="outline" type="button">
                                {{ importResult ? 'Cerrar' : 'Cancelar' }}
                            </UiButton>
                        </DialogClose>
                        <UiButton
                            v-if="
                                (importResult && retryImportFailures.length) ||
                                (!importResult &&
                                    !validImportRows.length &&
                                    invalidImportRows.length)
                            "
                            variant="outline"
                            type="button"
                            :loading="downloadingFailures"
                            @click="downloadPendingTerritories"
                        >
                            <Download class="size-4" />
                            Descargar pendientes
                        </UiButton>
                        <UiButton
                            v-if="!importResult"
                            type="button"
                            :loading="importTerritoriesMutation.isPending.value"
                            :disabled="!validImportRows.length || !!importPreview.fileErrors.length"
                            @click="confirmTerritoryImport"
                        >
                            <Upload class="size-4" />
                            Importar {{ validImportRows.length }} registro(s)
                        </UiButton>
                    </div>
                </DialogContent>
            </DialogPortal>
        </DialogRoot>

        <!-- Create / edit drawer (district · zone · sector) -->
        <TerritoryFormDrawer
            :open="formOpen"
            :level="formLevel"
            :mode="formMode"
            :entity="formEntity"
            :parent-centroid="formParentCentroid"
            :parent-label="formParentLabel"
            :palette="paletteFor(formLevel)"
            :accent="LEVEL_ACCENT[formLevel]"
            :level-label="formLevel"
            :leader-label="formLevel === 'distrito' ? 'Pastor' : 'Líder'"
            :supervisor-options="supervisors"
            :supervisors-loading="supervisorsQuery.isPending.value"
            :supervisors-error="supervisorCatalogError"
            :saving="hierarchySaving"
            @close="formOpen = false"
            @save="onFormSave"
            @retry-supervisors="supervisorsQuery.refetch()"
        />

        <!-- Assign existing catalog meetings to the selected sector -->
        <AssignMeetingDrawer
            :open="assignOpen"
            :sector-name="selSector?.name ?? ''"
            :accent="LEVEL_ACCENT.reunion"
            :items="assignItems"
            @close="assignOpen = false"
            @assign="assignMeeting"
            @go="goToMeeting"
        />
    </div>
</template>

<style scoped>
.hierarchy-drawer {
    animation: hierarchy-drawer-in 0.28s ease;
}
@keyframes hierarchy-drawer-in {
    from {
        transform: translateX(26px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
/* Contain Leaflet panes/controls in their own stacking context. */
.hierarchy-map {
    position: relative;
    z-index: 0;
    isolation: isolate;
}
.hierarchy-map :deep(.leaflet-control-zoom) {
    margin: 10px;
    border: 1px solid var(--outline-variant);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgb(0 0 0 / 35%);
}
.hierarchy-map :deep(.leaflet-control-zoom a) {
    width: 30px;
    height: 30px;
    line-height: 30px;
    background: var(--surface-container);
    color: var(--on-surface);
    border-bottom-color: var(--outline-variant);
}
.hierarchy-map :deep(.leaflet-control-zoom a:hover) {
    background: var(--surface-container-high);
    color: var(--primary);
}
</style>
