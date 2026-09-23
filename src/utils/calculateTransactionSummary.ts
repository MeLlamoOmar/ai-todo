import type { Transaction } from '../types/transaction'

export type TransactionSummary = {
  income: number
  expenses: number
  balance: number
}

export function calculateTransactionSummary(
  transactions: Transaction[],
): TransactionSummary {
  const totals = transactions.reduce(
    (summary, transaction) => {
      summary[transaction.type] += transaction.amount
      return summary
    },
    { income: 0, expense: 0 },
  )

  return {
    income: totals.income,
    expenses: totals.expense,
    balance: totals.income - totals.expense,
  }
}
