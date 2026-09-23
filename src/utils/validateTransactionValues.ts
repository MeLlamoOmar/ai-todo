import type { TransactionFormValues } from '../types/transaction'
import { isValidDate } from './date'

export function validateTransactionValues(
  values: TransactionFormValues,
): TransactionFormValues {
  const description = values.description.trim()
  const category = values.category.trim()

  if (values.type !== 'income' && values.type !== 'expense') {
    throw new Error('Transaction type is invalid')
  }

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
    type: values.type,
    description,
    amount: values.amount,
    category,
    date: values.date,
  }
}
