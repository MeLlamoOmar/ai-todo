import type { Expense } from '../types/expense';
import ExpenseItem from './ExpenseItem';

type ExpenseListProps = {
  expenses: Expense[];
};

function ExpenseList({ expenses }: ExpenseListProps) {
  return (
    <section
      className="mx-auto w-full max-w-xl"
      aria-labelledby="expenses-heading"
    >
      <h2
        id="expenses-heading"
        className="text-xl font-semibold text-slate-900"
      >
        Expenses
      </h2>

      {expenses.length === 0 ? (
        <p
          className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600"
          role="status"
        >
          No expenses yet. Add one using the form above.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {expenses.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ExpenseList;
