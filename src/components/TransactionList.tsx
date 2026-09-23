import type { Transaction } from '../types/transaction'
import TransactionItem from './TransactionItem'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

type TransactionListProps = {
  transactions: Transaction[]
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
}

function TransactionList({
  transactions,
  onDelete,
  onEdit,
}: TransactionListProps) {
  return (
    <section className="w-full" aria-labelledby="transactions-heading">
      <Card>
        <CardHeader className="border-b">
          <CardTitle id="transactions-heading">Recent transactions</CardTitle>
          <CardDescription>
            {transactions.length === 0
              ? 'Your recorded transactions will appear here.'
              : `${transactions.length} recorded transaction${transactions.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p
              className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              No transactions yet. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default TransactionList
