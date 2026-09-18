import type { ExpenseFormValues } from '../types/expense'
import { isValidDate } from './date'

export function validateExpenseValues(
  values: ExpenseFormValues,
): ExpenseFormValues {
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

  return {
    description,
    amount: values.amount,
    category,
    date: values.date,
  }
}
