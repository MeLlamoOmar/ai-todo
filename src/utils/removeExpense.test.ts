import { describe, expect, it } from 'vitest'
import type { Expense } from '../types/expense'
import { removeExpense } from './removeExpense'

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
  {
    id: 'expense-3',
    description: 'Book',
    amount: 15,
    category: 'Education',
    date: '2026-09-19',
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
  },
]

describe('removeExpense', () => {
  it('removes only the expense with the matching id', () => {
    const result = removeExpense(expenses, 'expense-2')

    expect(result).toEqual([expenses[0], expenses[2]])
  })

  it('keeps the remaining expenses in the same order', () => {
    const result = removeExpense(expenses, 'expense-1')

    expect(result.map((expense) => expense.id)).toEqual([
      'expense-2',
      'expense-3',
    ])
  })

  it('does not mutate the original list', () => {
    const originalExpenses = [...expenses]

    const result = removeExpense(expenses, 'expense-2')

    expect(expenses).toEqual(originalExpenses)
    expect(result).not.toBe(expenses)
  })

  it('returns all expenses when the id does not exist', () => {
    const result = removeExpense(expenses, 'missing-expense')

    expect(result).toEqual(expenses)
    expect(result).not.toBe(expenses)
  })

  it('returns an empty list when removing from an empty list', () => {
    const result = removeExpense([], 'expense-1')

    expect(result).toEqual([])
  })
})
