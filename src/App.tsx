import { useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import type { Expense, ExpenseFormValues } from './types/expense'
import { createExpense } from './utils/createExpense'
import { removeExpense } from './utils/removeExpense'

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  function handleAddExpense(expenseValues: ExpenseFormValues) {
    const expense = createExpense(expenseValues)

    setExpenses((currentExpenses) => [expense, ...currentExpenses])
  }

  function handleDeleteExpense(id: string) {
    setExpenses((currentExpenses) => removeExpense(currentExpenses, id))
  }

  return (
    <main className="min-h-svh bg-slate-50 p-4 sm:p-8">
      <div className="space-y-8">
        <ExpenseForm onSubmit={handleAddExpense} />
        <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
      </div>
    </main>
  )
}

export default App
