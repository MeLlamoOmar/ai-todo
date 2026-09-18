import type { Expense } from '../types/expense'

type ExpenseItemProps = {
  expense: Expense
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

function ExpenseItem({ expense }: ExpenseItemProps) {
  const expenseDate = new Date(`${expense.date}T00:00:00`)

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-medium text-slate-900">{expense.description}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {expense.category} · {dateFormatter.format(expenseDate)}
        </p>
      </div>
      <p className="text-lg font-semibold text-slate-900">
        {currencyFormatter.format(expense.amount)}
      </p>
    </li>
  )
}

export default ExpenseItem
