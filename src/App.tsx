import { useEffect, useState } from 'react';
import { Moon, Sun, WalletCards } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary';
import { Button } from './components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './components/ui/tooltip';
import type {
  Transaction,
  TransactionFormValues,
} from './types/transaction';
import { createTransaction } from './utils/createTransaction';
import { removeTransaction } from './utils/removeTransaction';
import { updateTransaction } from './utils/updateTransaction';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [transactionBeingEdited, setTransactionBeingEdited] =
    useState<Transaction | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  function handleSubmitTransaction(transactionValues: TransactionFormValues) {
    if (transactionBeingEdited) {
      setTransactions((currentTransactions) =>
        updateTransaction(
          currentTransactions,
          transactionBeingEdited.id,
          transactionValues,
        ),
      );
      setTransactionBeingEdited(null);
      return;
    }

    const transaction = createTransaction(transactionValues);

    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
  }

  function handleDeleteTransaction(id: string) {
    setTransactions((currentTransactions) =>
      removeTransaction(currentTransactions, id),
    );

    if (transactionBeingEdited?.id === id) {
      setTransactionBeingEdited(null);
    }
  }

  function handleEditTransaction(transaction: Transaction) {
    setTransactionBeingEdited(transaction);
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
                Transaction Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Keep your income and spending organized.
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

        <TransactionSummary transactions={transactions} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <TransactionForm
            key={transactionBeingEdited?.id ?? 'new-transaction'}
            onSubmit={handleSubmitTransaction}
            transactionToEdit={transactionBeingEdited}
            onCancelEdit={() => setTransactionBeingEdited(null)}
          />
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
