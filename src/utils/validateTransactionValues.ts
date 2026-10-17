import type { TransactionFormValues } from '../types/transaction.ts'
import { isValidDate } from './date.ts'

export function validateTransactionValues(
  values: unknown,
): TransactionFormValues {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Transaction values must be an object')
  }
  const input = values as Record<string, unknown>
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const category = typeof input.category === 'string' ? input.category.trim() : ''

  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Transaction type is invalid')
  }

  if (!description) {
    throw new Error('Description is required')
  }

  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  if (!category) {
    throw new Error('Category is required')
  }

  if (typeof input.date !== 'string' || !isValidDate(input.date)) {
    throw new Error('Date is invalid')
  }

  return {
    type: input.type,
    description,
    amount: input.amount,
    category,
    date: input.date,
  }
}
