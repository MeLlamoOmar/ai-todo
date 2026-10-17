import type { TransactionType } from '../types/transaction.ts'

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

const spanishLabels: Record<string, string> = {
  Food: 'Comida', Transport: 'Transporte', Housing: 'Vivienda',
  Utilities: 'Servicios', Health: 'Salud', Entertainment: 'Entretenimiento',
  Education: 'Educación', Other: 'Otros', Salary: 'Salario',
  Freelance: 'Trabajo independiente', Investments: 'Inversiones', Gift: 'Regalo',
}

export function getCategoryOptions(type: TransactionType) {
  return transactionCategories[type].map((value) => ({
    value,
    label: spanishLabels[value] ?? value,
  }))
}
