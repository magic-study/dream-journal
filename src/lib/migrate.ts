import { SCHEMA_VERSION, type DreamEntry, type DreamExportPayload } from '../types'

type LegacyEntry = Omit<DreamEntry, 'isNightmare' | 'draft'> & {
  isNightmare?: boolean
  draft?: boolean
}

type LegacyPayload = {
  meta?: { schemaVersion?: number; lastBackupAt?: string }
  entries: LegacyEntry[]
}

export function migratePayload(payload: LegacyPayload): DreamExportPayload {
  const incomingVersion = payload.meta?.schemaVersion ?? 0

  if (incomingVersion >= SCHEMA_VERSION) {
    return {
      meta: {
        schemaVersion: payload.meta?.schemaVersion ?? SCHEMA_VERSION,
        lastBackupAt: payload.meta?.lastBackupAt,
      },
      entries: payload.entries.map((entry) => ({
        ...entry,
        isNightmare: entry.isNightmare ?? false,
        draft: entry.draft ?? false,
      })),
    }
  }

  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      lastBackupAt: payload.meta?.lastBackupAt,
    },
    entries: payload.entries.map((entry) => ({
      ...entry,
      isNightmare: entry.isNightmare ?? false,
      draft: entry.draft ?? false,
    })),
  }
}
