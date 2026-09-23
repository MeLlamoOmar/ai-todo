import { describe, expect, it } from 'vitest'
import {
  isTransactionDateInRange,
  type TransactionDateRange,
} from './transactionDateRangeFilter'

describe('isTransactionDateInRange', () => {
  const range: TransactionDateRange = {
    startDate: '2026-09-10',
    endDate: '2026-09-20',
  }

  it.each(['2026-09-10', '2026-09-15', '2026-09-20'])(
    'includes %s within inclusive boundaries',
    (date) => {
      expect(isTransactionDateInRange(date, range)).toBe(true)
    },
  )

  it.each(['2026-09-09', '2026-09-21'])(
    'excludes %s outside the range',
    (date) => {
      expect(isTransactionDateInRange(date, range)).toBe(false)
    },
  )

  it('treats equal boundaries as a single-day range', () => {
    const singleDayRange = {
      startDate: '2026-09-15',
      endDate: '2026-09-15',
    }

    expect(isTransactionDateInRange('2026-09-15', singleDayRange)).toBe(true)
    expect(isTransactionDateInRange('2026-09-16', singleDayRange)).toBe(false)
  })

  it('matches any date when there is no range', () => {
    expect(isTransactionDateInRange('2026-09-15')).toBe(true)
  })
})
