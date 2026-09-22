import { useEffect, useState } from 'react';
import { Moon, Sun, WalletCards } from 'lucide-react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseSummary from './components/ExpenseSummary';
import { Button } from './components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './components/ui/tooltip';
import type { Expense, ExpenseFormValues } from './types/expense';
import { createExpense } from './utils/createExpense';
import { removeExpense } from './utils/removeExpense';
import { updateExpense } from './utils/updateExpense';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [expenseBeingEdited, setExpenseBeingEdited] = useState<Expense | null>(
    null,
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

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
    <main className="min-h-svh bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Keep your spending organized.
              </p>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setTheme((currentTheme) =>
                    currentTheme === 'dark' ? 'light' : 'dark',
                  )
                }
                aria-label={
                  theme === 'dark' ? 'Use light theme' : 'Use dark theme'
                }
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" aria-hidden="true" />
                ) : (
                  <Moon className="size-4" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
            </TooltipContent>
          </Tooltip>
        </header>

        <ExpenseSummary expenses={expenses} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
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
      </div>
    </main>
  );
}

export default App;
