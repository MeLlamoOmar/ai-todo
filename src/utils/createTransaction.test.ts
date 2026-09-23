import { describe, expect, it } from 'vitest'
import type { TransactionFormValues } from '../types/transaction'
import { createTransaction } from './createTransaction'

const validValues: TransactionFormValues = {
  type: 'expense',
  description: 'Groceries',
  amount: 42.5,
  category: 'Food',
  date: '2026-09-17',
}

describe('createTransaction', () => {
  it('creates a complete transaction from form values', () => {
    const transaction = createTransaction(validValues)

    expect(transaction).toMatchObject(validValues)
    expect(transaction.id).toEqual(expect.any(String))
    expect(transaction.id).not.toBe('')
    expect(transaction.createdAt).toBe(transaction.updatedAt)
    expect(new Date(transaction.createdAt).toISOString()).toBe(
      transaction.createdAt,
    )
  })

  it('creates income transactions', () => {
    const transaction = createTransaction({
      ...validValues,
      type: 'income',
      description: 'Salary',
      category: 'Salary',
    })

    expect(transaction.type).toBe('income')
  })

  it('creates a unique id for each transaction', () => {
    const firstTransaction = createTransaction(validValues)
    const secondTransaction = createTransaction(validValues)

    expect(firstTransaction.id).not.toBe(secondTransaction.id)
  })

  it('does not mutate the form values', () => {
    const values = { ...validValues }
    const originalValues = { ...values }

    createTransaction(values)

    expect(values).toEqual(originalValues)
  })

  it.each(['', '   '])(
    'throws when description is invalid: %j',
    (description) => {
      expect(() =>
        createTransaction({ ...validValues, description }),
      ).toThrow()
    },
  )

  it.each([0, -1, Number.NaN])(
    'throws when amount is invalid: %s',
    (amount) => {
      expect(() => createTransaction({ ...validValues, amount })).toThrow()
    },
  )

  it.each(['', '   '])('throws when category is invalid: %j', (category) => {
    expect(() => createTransaction({ ...validValues, category })).toThrow()
  })

  it.each(['', '09/17/2026', '2026-02-30'])(
    'throws when date is invalid: %j',
    (date) => {
      expect(() => createTransaction({ ...validValues, date })).toThrow()
    },
  )
})
