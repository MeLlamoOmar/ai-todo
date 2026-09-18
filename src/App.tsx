import { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import type { Expense, ExpenseFormValues } from './types/expense';
import { createExpense } from './utils/createExpense';
import { removeExpense } from './utils/removeExpense';
import { updateExpense } from './utils/updateExpense';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseBeingEdited, setExpenseBeingEdited] = useState<Expense | null>(
    null,
  );

  function handleSubmitExpense(expenseValues: ExpenseFormValues) {
    if (expenseBeingEdited) {
      setExpenses((currentExpenses) =>
        updateExpense(currentExpenses, expenseBeingEdited.id, expenseValues),
      );
      setExpenseBeingEdited(null);
      return;
    }

    const expense = createExpense(expenseValues);

    setExpenses((currentExpenses) => [expense, ...currentExpenses]);
  }

  function handleDeleteExpense(id: string) {
    setExpenses((currentExpenses) => removeExpense(currentExpenses, id));

    if (expenseBeingEdited?.id === id) {
      setExpenseBeingEdited(null);
    }
  }

  function handleEditExpense(expense: Expense) {
    setExpenseBeingEdited(expense);
  }

  return (
    <main className="min-h-svh bg-slate-50 p-4 sm:p-8">
      <div className="space-y-8">
        <ExpenseForm
          key={expenseBeingEdited?.id ?? 'new-expense'}
          onSubmit={handleSubmitExpense}
          expenseToEdit={expenseBeingEdited}
          onCancelEdit={() => setExpenseBeingEdited(null)}
        />
        <ExpenseList
          expenses={expenses}
          onDelete={handleDeleteExpense}
          onEdit={handleEditExpense}
        />
      </div>
    </main>
  );
}

export default App;
