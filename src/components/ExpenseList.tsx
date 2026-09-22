import type { Expense } from '../types/expense';
import ExpenseItem from './ExpenseItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type ExpenseListProps = {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
};

function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  return (
    <section
      className="w-full"
      aria-labelledby="expenses-heading"
    >
      <Card>
        <CardHeader className="border-b">
          <CardTitle id="expenses-heading">Recent expenses</CardTitle>
          <CardDescription>
            {expenses.length === 0
              ? 'Your recorded expenses will appear here.'
              : `${expenses.length} recorded expense${expenses.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p
              className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              No expenses yet. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default ExpenseList;
