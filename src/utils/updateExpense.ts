import type { Expense, ExpenseFormValues } from '../types/expense'
import { validateExpenseValues } from './validateExpenseValues'

export function updateExpense(
  expenses: Expense[],
  id: string,
  values: ExpenseFormValues,
): Expense[] {
  const updatedValues = validateExpenseValues(values)
  const updatedAt = new Date().toISOString()

  return expenses.map((expense) =>
    expense.id === id
      ? {
          ...expense,
          ...updatedValues,
          updatedAt,
        }
      : expense,
  )
}
