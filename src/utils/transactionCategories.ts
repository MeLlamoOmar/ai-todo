import type { TransactionType } from '../types/transaction'

export const transactionCategories: Record<
  TransactionType,
  readonly string[]
> = {
  expense: [
    'Food',
    'Transport',
    'Housing',
    'Utilities',
    'Health',
    'Entertainment',
    'Education',
    'Other',
  ],
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
}

export const allTransactionCategories = [
  ...new Set([
    ...transactionCategories.expense,
    ...transactionCategories.income,
  ]),
]
