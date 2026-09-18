import { describe, expect, it } from 'vitest'
import type { ExpenseFormValues } from '../types/expense'
import { createExpense } from './createExpense'

const validValues: ExpenseFormValues = {
  description: 'Groceries',
  amount: 42.5,
  category: 'Food',
  date: '2026-09-17',
}

describe('createExpense', () => {
  it('creates a complete expense from form values', () => {
    const expense = createExpense(validValues)

    expect(expense).toMatchObject(validValues)
    expect(expense.id).toEqual(expect.any(String))
    expect(expense.id).not.toBe('')
    expect(expense.createdAt).toBe(expense.updatedAt)
    expect(new Date(expense.createdAt).toISOString()).toBe(expense.createdAt)
  })

  it('creates a unique id for each expense', () => {
    const firstExpense = createExpense(validValues)
    const secondExpense = createExpense(validValues)

    expect(firstExpense.id).not.toBe(secondExpense.id)
  })

  it('does not mutate the form values', () => {
    const values = { ...validValues }
    const originalValues = { ...values }

    createExpense(values)

    expect(values).toEqual(originalValues)
  })

  it.each(['', '   '])(
    'throws when description is invalid: %j',
    (description) => {
      expect(() => createExpense({ ...validValues, description })).toThrow()
    },
  )

  it.each([0, -1, Number.NaN])(
    'throws when amount is invalid: %s',
    (amount) => {
      expect(() => createExpense({ ...validValues, amount })).toThrow()
    },
  )

  it.each(['', '   '])('throws when category is invalid: %j', (category) => {
    expect(() => createExpense({ ...validValues, category })).toThrow()
  })

  it.each(['', '09/17/2026', '2026-02-30'])(
    'throws when date is invalid: %j',
    (date) => {
      expect(() => createExpense({ ...validValues, date })).toThrow()
    },
  )
})
