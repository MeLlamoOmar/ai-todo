import { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseSummary from './components/ExpenseSummary';
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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_36rem_minmax(0,1fr)] xl:items-start">
          <div className="mx-auto w-full max-w-xl xl:col-start-2 xl:max-w-none">
            <ExpenseForm
              key={expenseBeingEdited?.id ?? 'new-expense'}
              onSubmit={handleSubmitExpense}
              expenseToEdit={expenseBeingEdited}
              onCancelEdit={() => setExpenseBeingEdited(null)}
            />
          </div>
          <div className="mx-auto w-full max-w-xl xl:col-start-3 xl:max-w-none">
            <ExpenseSummary expenses={expenses} />
          </div>
        </div>
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
