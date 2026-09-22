import { describe, expect, it } from 'vitest'
import type { Expense } from '../types/expense'
import { calculateTotalExpenses } from './calculateTotalExpenses'

const expenses: Expense[] = [
  {
    id: 'expense-1',
    description: 'Groceries',
    amount: 42.5,
    category: 'Food',
    date: '2026-09-17',
    createdAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'expense-2',
    description: 'Bus fare',
    amount: 2.5,
    category: 'Transport',
    date: '2026-09-18',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
]

describe('calculateTotalExpenses', () => {
  it('returns zero for an empty list', () => {
    expect(calculateTotalExpenses([])).toBe(0)
  })

  it('adds the amounts of all expenses, including decimals', () => {
    expect(calculateTotalExpenses(expenses)).toBe(45)
  })

  it('does not mutate the original list', () => {
    const originalExpenses = expenses.map((expense) => ({ ...expense }))

    calculateTotalExpenses(expenses)

    expect(expenses).toEqual(originalExpenses)
  })
})
