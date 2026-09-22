import type { Expense } from '../types/expense'
import { calculateTotalExpenses } from '../utils/calculateTotalExpenses'

type ExpenseSummaryProps = {
  expenses: Expense[]
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const total = calculateTotalExpenses(expenses)

  return (
    <section
      className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="total-spent-heading"
    >
      <h2
        id="total-spent-heading"
        className="text-sm font-medium text-slate-600"
      >
        Total spent
      </h2>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {currencyFormatter.format(total)}
      </p>
    </section>
  )
}

export default ExpenseSummary
