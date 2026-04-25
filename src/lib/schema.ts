import { z } from 'zod'
import { SCHEMA_VERSION } from '../types'

const moodSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])

export const dreamEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  dreamDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()),
  emotion: moodSchema,
  vividness: moodSchema,
  isLucid: z.boolean(),
  isNightmare: z.boolean(),
  draft: z.boolean(),
})

export const exportPayloadSchema = z.object({
  meta: z.object({
    schemaVersion: z.number().default(SCHEMA_VERSION),
    lastBackupAt: z.string().optional(),
  }),
  entries: z.array(dreamEntrySchema),
})
