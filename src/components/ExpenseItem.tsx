import type { Expense } from '../types/expense'

type ExpenseItemProps = {
  expense: Expense
  onDelete: (id: string) => void
  onEdit: (expense: Expense) => void
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

function ExpenseItem({ expense, onDelete, onEdit }: ExpenseItemProps) {
  const expenseDate = new Date(`${expense.date}T00:00:00`)

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete expense "${expense.description}"?`,
    )

    if (confirmed) {
      onDelete(expense.id)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-medium text-slate-900">{expense.description}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {expense.category} · {dateFormatter.format(expenseDate)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-lg font-semibold text-slate-900">
          {currencyFormatter.format(expense.amount)}
        </p>
        <div className="flex gap-3">
          <button
            className="text-slate-600 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            type="button"
            onClick={() => onEdit(expense)}
            aria-label="Edit expense"
            title="Edit expense"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 2.651 2.651M4.5 19.5l3.969-.992L19.513 7.464a1.875 1.875 0 0 0-2.652-2.652L5.817 15.856 4.5 19.5Z"
              />
            </svg>
          </button>
          <button
            className="text-red-600 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            type="button"
            onClick={handleDelete}
            aria-label="Delete expense"
            title="Delete expense"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 6V4h8v2M19 6l-1 14H6L5 6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 11v5M14 11v5"
              />
            </svg>
          </button>
        </div>
      </div>
    </li>
  )
}

export default ExpenseItem
