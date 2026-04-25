import { openDB } from 'idb'
import { SCHEMA_VERSION, type DreamEntry } from '../types'

const DB_NAME = 'dream-journal'
const DB_VERSION = 1
const ENTRY_STORE = 'entries'
const META_STORE = 'meta'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(ENTRY_STORE)) {
      db.createObjectStore(ENTRY_STORE, { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains(META_STORE)) {
      db.createObjectStore(META_STORE)
    }
  },
})

export async function getAllEntries() {
  const db = await dbPromise
  return db.getAll(ENTRY_STORE) as Promise<DreamEntry[]>
}

export async function saveEntry(entry: DreamEntry) {
  const db = await dbPromise
  await db.put(ENTRY_STORE, entry)
}

export async function deleteEntry(id: string) {
  const db = await dbPromise
  await db.delete(ENTRY_STORE, id)
}

export async function clearEntries() {
  const db = await dbPromise
  await db.clear(ENTRY_STORE)
}

export async function getMeta() {
  const db = await dbPromise
  const version = (await db.get(META_STORE, 'schemaVersion')) as number | undefined
  const lastBackupAt = (await db.get(META_STORE, 'lastBackupAt')) as string | undefined
  return {
    schemaVersion: version ?? SCHEMA_VERSION,
    lastBackupAt,
  }
}

export async function setMeta(data: { schemaVersion?: number; lastBackupAt?: string }) {
  const db = await dbPromise
  if (data.schemaVersion !== undefined) {
    await db.put(META_STORE, data.schemaVersion, 'schemaVersion')
  }
  if (data.lastBackupAt !== undefined) {
    await db.put(META_STORE, data.lastBackupAt, 'lastBackupAt')
  }
}
