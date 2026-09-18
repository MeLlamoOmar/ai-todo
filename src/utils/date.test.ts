import { describe, expect, it } from 'vitest'
import { isValidDate } from './date'

describe('isValidDate', () => {
  it.each(['2026-09-17', '2024-02-29'])(
    'accepts a valid date: %s',
    (value) => {
      expect(isValidDate(value)).toBe(true)
    },
  )

  it.each(['', '09/17/2026', '2026-9-17'])(
    'rejects an invalid date format: %j',
    (value) => {
      expect(isValidDate(value)).toBe(false)
    },
  )

  it.each(['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01'])(
    'rejects an impossible date: %s',
    (value) => {
      expect(isValidDate(value)).toBe(false)
    },
  )
})
