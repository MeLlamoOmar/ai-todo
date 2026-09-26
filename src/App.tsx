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
import {
  deleteTransaction,
  insertTransaction,
  listTransactions,
  saveTransaction,
} from './utils/transactionRepository';
import { updateTransaction } from './utils/updateTransaction';

type Theme = 'light' | 'dark';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let isCurrent = true;

    void listTransactions()
      .then((loadedTransactions) => {
        if (isCurrent) {
          setTransactions(loadedTransactions);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  async function handleSubmitTransaction(
    transactionValues: TransactionFormValues,
  ): Promise<boolean> {
    setActionError(null);

    try {
      if (transactionBeingEdited) {
        const id = transactionBeingEdited.id;
        const updatedTransaction = updateTransaction(
          transactions,
          id,
          transactionValues,
        ).find((transaction) => transaction.id === id);

        if (!updatedTransaction) {
          throw new Error('This transaction is no longer available.');
        }

        const savedTransaction = await saveTransaction(updatedTransaction);

        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === id ? savedTransaction : transaction,
          ),
        );
        setTransactionBeingEdited((currentTransaction) =>
          currentTransaction?.id === id ? null : currentTransaction,
        );
        return true;
      }

      const transaction = createTransaction(transactionValues);
      const savedTransaction = await insertTransaction(transaction);

      setTransactions((currentTransactions) => [
        savedTransaction,
        ...currentTransactions,
      ]);
      return true;
    } catch (error) {
      setActionError(`Could not save transaction. ${getErrorMessage(error)}`);
      return false;
    }
  }

  async function handleDeleteTransaction(id: string) {
    setActionError(null);

    try {
      await deleteTransaction(id);
      setTransactions((currentTransactions) =>
        removeTransaction(currentTransactions, id),
      );
      setTransactionBeingEdited((currentTransaction) =>
        currentTransaction?.id === id ? null : currentTransaction,
      );
    } catch (error) {
      setActionError(`Could not delete transaction. ${getErrorMessage(error)}`);
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

        {isLoading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading transactions...
          </p>
        ) : loadError ? (
          <div role="alert" className="space-y-3 rounded-xl border p-5">
            <p>Could not load transactions. {loadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                setLoadAttempt((currentAttempt) => currentAttempt + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {actionError && (
              <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
                {actionError}
              </p>
            )}

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
          </>
        )}
      </div>
    </main>
  );
}

export default App;
