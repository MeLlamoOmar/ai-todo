import { useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import type { Expense, ExpenseFormValues } from './types/expense'

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  function handleAddExpense(expenseValues: ExpenseFormValues) {
    const timestamp = new Date().toISOString()
    const expense: Expense = {
      id: crypto.randomUUID(),
      ...expenseValues,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    setExpenses((currentExpenses) => [expense, ...currentExpenses])
  }

  return (
    <main className="min-h-svh bg-slate-50 p-4 sm:p-8">
      <div className="space-y-8">
        <ExpenseForm onSubmit={handleAddExpense} />
        <ExpenseList expenses={expenses} />
      </div>
    </main>
  )
}

export default App
