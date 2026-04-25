import { describe, expect, it } from 'vitest'
import { migratePayload } from './migrate'

describe('migratePayload', () => {
  it('fills new fields for legacy records', () => {
    const result = migratePayload({
      meta: { schemaVersion: 0 },
      entries: [
        {
          id: '1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          dreamDate: '2026-01-01',
          content: 'flying over water',
          tags: ['fly'],
          emotion: 4,
          vividness: 5,
          isLucid: true,
        },
      ],
    })
    expect(result.entries[0].isNightmare).toBe(false)
    expect(result.entries[0].draft).toBe(false)
    expect(result.meta.schemaVersion).toBe(1)
  })
})
