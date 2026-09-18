import type { Expense, ExpenseFormValues } from '../types/expense'
import { validateExpenseValues } from './validateExpenseValues'

export function createExpense(values: ExpenseFormValues): Expense {
  const expenseValues = validateExpenseValues(values)
  const timestamp = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    ...expenseValues,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
