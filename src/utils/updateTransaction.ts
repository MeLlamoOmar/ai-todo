import type { Transaction, TransactionFormValues } from '../types/transaction'
import { validateTransactionValues } from './validateTransactionValues'

export function updateTransaction(
  transactions: Transaction[],
  id: string,
  values: TransactionFormValues,
): Transaction[] {
  const updatedValues = validateTransactionValues(values)
  const updatedAt = new Date().toISOString()

  return transactions.map((transaction) =>
    transaction.id === id
      ? {
          ...transaction,
          ...updatedValues,
          updatedAt,
        }
      : transaction,
  )
}
