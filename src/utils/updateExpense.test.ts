import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Expense, ExpenseFormValues } from '../types/expense'
import { updateExpense } from './updateExpense'

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

const updatedValues: ExpenseFormValues = {
  description: 'Monthly bus pass',
  amount: 45,
  category: 'Transport',
  date: '2026-09-20',
}

afterEach(() => {
  vi.useRealTimers()
})

describe('updateExpense', () => {
  it('updates only the matching expense and preserves its identity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))

    const result = updateExpense(expenses, 'expense-2', updatedValues)

    expect(result).toHaveLength(3)
    expect(result[0]).toBe(expenses[0])
    expect(result[2]).toBe(expenses[2])
    expect(result[1]).toMatchObject({
      ...updatedValues,
      id: 'expense-2',
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-21T12:00:00.000Z',
    })
  })

  it('keeps expenses in the same order without mutating the original list', () => {
    const originalExpenses = expenses.map((expense) => ({ ...expense }))

    const result = updateExpense(expenses, 'expense-2', updatedValues)

    expect(result.map((expense) => expense.id)).toEqual([
      'expense-1',
      'expense-2',
      'expense-3',
    ])
    expect(expenses).toEqual(originalExpenses)
    expect(result).not.toBe(expenses)
  })

  it('returns all expenses when the id does not exist', () => {
    const result = updateExpense(expenses, 'missing-expense', updatedValues)

    expect(result).toEqual(expenses)
    expect(result).not.toBe(expenses)
  })

  it('normalizes text values before updating an expense', () => {
    const result = updateExpense(expenses, 'expense-2', {
      ...updatedValues,
      description: '  Monthly bus pass  ',
      category: '  Transport  ',
    })

    expect(result[1].description).toBe('Monthly bus pass')
    expect(result[1].category).toBe('Transport')
  })

  it.each([
    { ...updatedValues, description: '' },
    { ...updatedValues, amount: 0 },
    { ...updatedValues, category: '   ' },
    { ...updatedValues, date: '2026-02-30' },
  ])('rejects invalid expense values', (values) => {
    expect(() => updateExpense(expenses, 'expense-2', values)).toThrow()
  })
})
