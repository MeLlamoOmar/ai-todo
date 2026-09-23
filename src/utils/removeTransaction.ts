import type { Transaction } from '../types/transaction'

export function removeTransaction(
  transactions: Transaction[],
  id: string,
): Transaction[] {
  return transactions.filter((transaction) => transaction.id !== id)
}
