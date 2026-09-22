import { DollarSign } from 'lucide-react'
import type { Expense } from '../types/expense'
import { calculateTotalExpenses } from '../utils/calculateTotalExpenses'
import { Card, CardContent } from './ui/card'

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
    <Card
      className="border-primary/10 bg-primary text-primary-foreground shadow-sm"
      aria-labelledby="total-spent-heading"
    >
      <CardContent className="flex items-center justify-between">
        <div>
          <p id="total-spent-heading" className="text-sm text-primary-foreground/75">
            Total spent
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {currencyFormatter.format(total)}
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
          <DollarSign className="size-6" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpenseSummary
