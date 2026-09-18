import type { Expense, ExpenseFormValues } from '../types/expense'
import { isValidDate } from './date'

export function createExpense(values: ExpenseFormValues): Expense {
  const description = values.description.trim()
  const category = values.category.trim()

  if (!description) {
    throw new Error('Description is required')
  }

  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  if (!category) {
    throw new Error('Category is required')
  }

  if (!isValidDate(values.date)) {
    throw new Error('Date is invalid')
  }

  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    description,
    amount: values.amount,
    category,
    date: values.date,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
