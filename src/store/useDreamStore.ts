import { create } from 'zustand'
import { exportPayloadSchema } from '../lib/schema'
import { migratePayload } from '../lib/migrate'
import {
  clearEntries,
  deleteEntry,
  getAllEntries,
  getMeta,
  saveEntry,
  setMeta,
} from '../lib/db'
import { SCHEMA_VERSION, type DreamEntry, type DreamExportPayload, type MoodScore } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

const createDraft = (): DreamEntry => {
  const iso = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    createdAt: iso,
    updatedAt: iso,
    dreamDate: today(),
    content: '',
    tags: [],
    emotion: 3,
    vividness: 3,
    isLucid: false,
    isNightmare: false,
    draft: true,
  }
}

type DraftInput = Partial<DreamEntry> & Pick<DreamEntry, 'content'>
type Filters = { query: string; tag: string; lucidOnly: boolean; emotionMin: MoodScore | 1 }
const DRAFT_KEY = 'dream-draft'

interface DreamState {
  entries: DreamEntry[]
  draft: DreamEntry
  draftHistory: DreamEntry[]
  selectedId: string | null
  filters: Filters
  loading: boolean
  init: () => Promise<void>
  setFilters: (filters: Partial<Filters>) => void
  updateDraft: (changes: Partial<DraftInput>) => void
  undoDraft: () => void
  createNewDraft: () => void
  saveDraftAsEntry: () => Promise<void>
  editEntry: (id: string, payload: Partial<DreamEntry>) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  setSelectedId: (id: string | null) => void
  exportData: () => Promise<DreamExportPayload>
  importData: (raw: string) => Promise<void>
  clearAll: () => Promise<void>
}

export const useDreamStore = create<DreamState>((set, get) => ({
  entries: [],
  draft: createDraft(),
  draftHistory: [],
  selectedId: null,
  loading: true,
  filters: {
    query: '',
    tag: '',
    lucidOnly: false,
    emotionMin: 1,
  },
  init: async () => {
    const [entries] = await Promise.all([getAllEntries(), setMeta({ schemaVersion: SCHEMA_VERSION })])
    const cachedDraft = localStorage.getItem(DRAFT_KEY)
    entries.sort((a, b) => b.dreamDate.localeCompare(a.dreamDate))
    set({
      entries,
      draft: cachedDraft ? { ...createDraft(), ...JSON.parse(cachedDraft), draft: true } : createDraft(),
      loading: false,
    })
  },
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  updateDraft: (changes) =>
    set((state) => {
      const nextHistory = [...state.draftHistory, state.draft].slice(-50)
      const draft = { ...state.draft, ...changes, updatedAt: new Date().toISOString() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      return { draft, draftHistory: nextHistory }
    }),
  undoDraft: () =>
    set((state) => {
      const previous = state.draftHistory[state.draftHistory.length - 1]
      if (!previous) return state
      const draftHistory = state.draftHistory.slice(0, -1)
      localStorage.setItem(DRAFT_KEY, JSON.stringify(previous))
      return { draft: previous, draftHistory }
    }),
  createNewDraft: () => {
    localStorage.removeItem(DRAFT_KEY)
    set({ draft: createDraft(), draftHistory: [] })
  },
  saveDraftAsEntry: async () => {
    const draft = get().draft
    if (!draft.content.trim()) {
      return
    }
    const finalEntry = { ...draft, draft: false, updatedAt: new Date().toISOString() }
    await saveEntry(finalEntry)
    localStorage.removeItem(DRAFT_KEY)
    set((state) => ({
      entries: [finalEntry, ...state.entries.filter((entry) => entry.id !== finalEntry.id)].sort((a, b) =>
        b.dreamDate.localeCompare(a.dreamDate),
      ),
      draft: createDraft(),
      draftHistory: [],
    }))
  },
  editEntry: async (id, payload) => {
    const current = get().entries.find((entry) => entry.id === id)
    if (!current) return
    const updated = { ...current, ...payload, updatedAt: new Date().toISOString() }
    await saveEntry(updated)
    set((state) => ({
      entries: state.entries
        .map((entry) => (entry.id === id ? updated : entry))
        .sort((a, b) => b.dreamDate.localeCompare(a.dreamDate)),
    }))
  },
  removeEntry: async (id) => {
    await deleteEntry(id)
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
  },
  setSelectedId: (id) => set({ selectedId: id }),
  exportData: async () => {
    const [entries, meta] = await Promise.all([getAllEntries(), getMeta()])
    const lastBackupAt = new Date().toISOString()
    await setMeta({ lastBackupAt, schemaVersion: SCHEMA_VERSION })
    return {
      meta: { ...meta, schemaVersion: SCHEMA_VERSION, lastBackupAt },
      entries,
    }
  },
  importData: async (raw) => {
    const parsed = JSON.parse(raw) as { meta?: { schemaVersion?: number; lastBackupAt?: string }; entries: unknown[] }
    const migrated = migratePayload(parsed as Parameters<typeof migratePayload>[0])
    const validated = exportPayloadSchema.parse(migrated)
    await clearEntries()
    for (const entry of validated.entries) {
      await saveEntry(entry)
    }
    await setMeta(validated.meta)
    const entries = await getAllEntries()
    set({
      entries: entries.sort((a, b) => b.dreamDate.localeCompare(a.dreamDate)),
      selectedId: null,
    })
  },
  clearAll: async () => {
    await clearEntries()
    set({ entries: [], selectedId: null, draft: createDraft(), draftHistory: [] })
  },
}))
