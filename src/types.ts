export const SCHEMA_VERSION = 1

export type MoodScore = 1 | 2 | 3 | 4 | 5

export interface DreamEntry {
  id: string
  createdAt: string
  updatedAt: string
  dreamDate: string
  title?: string
  content: string
  tags: string[]
  emotion: MoodScore
  vividness: MoodScore
  isLucid: boolean
  isNightmare: boolean
  draft: boolean
}

export interface AppMeta {
  schemaVersion: number
  lastBackupAt?: string
}

export interface DreamExportPayload {
  meta: AppMeta
  entries: DreamEntry[]
}
