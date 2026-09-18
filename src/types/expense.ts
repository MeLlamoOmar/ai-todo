export type Expense = {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
  updatedAt: string
}

export type ExpenseFormValues = Omit<
  Expense,
  'id' | 'createdAt' | 'updatedAt'
>
