import { defineStore } from 'pinia'
import { readJsonStorage, writeJsonStorage } from '~/utils/storage/json-storage.util'
import type {
    EnvelopeCategory,
    ReceptionCategoryResult,
    ReceptionCountInput,
} from '../interfaces/reception.interface'

const STORAGE_KEY = 'support-committee-reception-drafts'
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000

export type DraftMode = 'recibir' | 'corregir'

export interface DraftCategory extends EnvelopeCategory {
    quantities: Record<string, number | null>
    extra?: boolean
}

export interface ReceptionDraft {
    occurrenceId: number
    mode: DraftMode
    categories: DraftCategory[]
    currentIndex: number
    notes: string
    updatedAt: number
}

interface ReceptionDraftState {
    drafts: Record<string, ReceptionDraft>
    loaded: boolean
}

function quantitiesFromCounts(counts: ReceptionCategoryResult['counts']) {
    return Object.fromEntries(
        counts.map((count) => [String(count.denomination.id), count.quantity]),
    ) as Record<string, number | null>
}

function hasCounts(category: DraftCategory) {
    return Object.values(category.quantities).some((quantity) => !!quantity)
}

export const useReceptionDraftStore = defineStore('support-committee-reception-draft', {
    state: (): ReceptionDraftState => ({
        drafts: {},
        loaded: false,
    }),
    getters: {
        draftFor:
            (state) =>
            (occurrenceId: number): ReceptionDraft | null =>
                state.drafts[String(occurrenceId)] ?? null,
        hasDraft:
            (state) =>
            (occurrenceId: number): boolean => {
                const draft = state.drafts[String(occurrenceId)]
                return !!draft && draft.mode === 'recibir'
            },
    },
    actions: {
        ensureLoaded() {
            if (this.loaded || !import.meta.client) return
            const stored = readJsonStorage<Record<string, ReceptionDraft>>(STORAGE_KEY, {})
            const now = Date.now()
            this.drafts = Object.fromEntries(
                Object.entries(stored).filter(([, draft]) => now - draft.updatedAt < DRAFT_TTL_MS),
            )
            this.loaded = true
        },
        persist() {
            try {
                writeJsonStorage(STORAGE_KEY, this.drafts)
            } catch {
                return
            }
        },
        touch(occurrenceId: number) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return
            draft.updatedAt = Date.now()
            this.persist()
        },
        startDraft(occurrenceId: number, registered: EnvelopeCategory[]) {
            this.drafts[String(occurrenceId)] = {
                occurrenceId,
                mode: 'recibir',
                categories: registered.map((category) => ({ ...category, quantities: {} })),
                currentIndex: 0,
                notes: '',
                updatedAt: Date.now(),
            }
            this.persist()
        },
        startCorrection(
            occurrenceId: number,
            categories: ReceptionCategoryResult[],
            registered: EnvelopeCategory[],
            notes: string | null,
        ) {
            const registeredIds = new Set(registered.map((category) => category.categoryId))
            this.drafts[String(occurrenceId)] = {
                occurrenceId,
                mode: 'corregir',
                categories: categories.map((category) => ({
                    categoryId: category.categoryId,
                    categoryName: category.categoryName,
                    quantities: quantitiesFromCounts(category.counts),
                    extra: !registeredIds.has(category.categoryId),
                })),
                currentIndex: 0,
                notes: notes ?? '',
                updatedAt: Date.now(),
            }
            this.persist()
        },
        setQuantity(
            occurrenceId: number,
            categoryIndex: number,
            denominationId: number,
            quantity: number | null,
        ) {
            const category = this.drafts[String(occurrenceId)]?.categories[categoryIndex]
            if (!category) return
            category.quantities[String(denominationId)] = quantity
            this.touch(occurrenceId)
        },
        setCurrentIndex(occurrenceId: number, index: number) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return
            draft.currentIndex = Math.min(Math.max(index, 0), draft.categories.length - 1)
            this.touch(occurrenceId)
        },
        syncCategories(occurrenceId: number, registered: EnvelopeCategory[]) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return

            const current = draft.categories[draft.currentIndex]?.categoryId
            const byId = new Map(draft.categories.map((item) => [item.categoryId, item]))
            const registeredIds = new Set(registered.map((category) => category.categoryId))
            const extras = draft.categories.filter(
                (item) => !registeredIds.has(item.categoryId) && (item.extra || hasCounts(item)),
            )
            const next = [
                ...registered.map(
                    (category) => byId.get(category.categoryId) ?? { ...category, quantities: {} },
                ),
                ...extras,
            ]

            const unchanged =
                next.length === draft.categories.length &&
                next.every((item, index) => item === draft.categories[index]) &&
                extras.every((item) => item.extra)
            if (unchanged) return

            for (const item of extras) item.extra = true
            draft.categories = next
            draft.currentIndex = Math.max(
                0,
                next.findIndex((item) => item.categoryId === current),
            )
            this.touch(occurrenceId)
        },
        addCategory(occurrenceId: number, category: EnvelopeCategory) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return
            const existing = draft.categories.findIndex(
                (item) => item.categoryId === category.categoryId,
            )
            if (existing === -1) {
                draft.categories.push({ ...category, quantities: {}, extra: true })
                draft.currentIndex = draft.categories.length - 1
            } else {
                draft.currentIndex = existing
            }
            this.touch(occurrenceId)
        },
        removeCategory(occurrenceId: number, categoryId: number | null) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return
            const index = draft.categories.findIndex((item) => item.categoryId === categoryId)
            if (index === -1 || !draft.categories[index]!.extra) return
            draft.categories.splice(index, 1)
            draft.currentIndex = Math.min(
                draft.currentIndex >= index
                    ? Math.max(draft.currentIndex - 1, 0)
                    : draft.currentIndex,
                Math.max(draft.categories.length - 1, 0),
            )
            this.touch(occurrenceId)
        },
        setNotes(occurrenceId: number, notes: string) {
            const draft = this.drafts[String(occurrenceId)]
            if (!draft) return
            draft.notes = notes
            this.touch(occurrenceId)
        },
        clearDraft(occurrenceId: number) {
            const { [String(occurrenceId)]: _removed, ...remaining } = this.drafts
            this.drafts = remaining
            this.persist()
        },
    },
})

export function draftToCountInput(draft: ReceptionDraft): ReceptionCountInput {
    return {
        categories: draft.categories
            .map((category) => ({
                categoryId: category.categoryId,
                counts: Object.entries(category.quantities)
                    .filter(([, quantity]) => quantity !== null && quantity > 0)
                    .map(([denominationId, quantity]) => ({
                        denominationId: Number(denominationId),
                        quantity: quantity as number,
                    })),
            }))
            .filter((category) => category.counts.length > 0),
    }
}
