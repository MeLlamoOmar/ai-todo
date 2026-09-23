import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import type { Transaction } from '../types/transaction';
import { calculateTransactionSummary } from '../utils/calculateTransactionSummary';
import { Card, CardContent } from './ui/card';

type TransactionSummaryProps = {
  transactions: Transaction[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const summary = calculateTransactionSummary(transactions);

  return (
    <section
      className="grid gap-4 sm:grid-cols-3"
      aria-labelledby="transaction-summary-heading"
    >
      <h2 id="transaction-summary-heading" className="sr-only">
        Transaction summary
      </h2>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total income</p>
            <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {currencyFormatter.format(summary.income)}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total expenses</p>
            <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400">
              {currencyFormatter.format(summary.expenses)}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <ArrowDownLeft className="size-5" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p
              className={`mt-1 font-heading text-2xl font-semibold tracking-tight ${
                summary.balance < 0 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {currencyFormatter.format(summary.balance)}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default TransactionSummary;
