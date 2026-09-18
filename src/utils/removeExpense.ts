import type { Expense } from '../types/expense'

export function removeExpense(expenses: Expense[], id: string): Expense[] {
  return expenses.filter((expense) => expense.id !== id)
}
