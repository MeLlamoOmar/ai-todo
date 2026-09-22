import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'
import type { Expense, ExpenseFormValues } from '../types/expense'
import { isValidDate } from '../utils/date'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type ExpenseFormProps = {
  onSubmit: (expense: ExpenseFormValues) => void
  expenseToEdit?: Expense | null
  onCancelEdit?: () => void
}

type FormErrors = Partial<Record<keyof ExpenseFormValues, string>>

const expenseCategories = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Education',
  'Other',
]

function getToday() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function toCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function ExpenseForm({
  onSubmit,
  expenseToEdit = null,
  onCancelEdit,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(
    expenseToEdit?.description ?? '',
  )
  const [amount, setAmount] = useState(expenseToEdit?.amount.toString() ?? '')
  const [category, setCategory] = useState(expenseToEdit?.category ?? '')
  const [date, setDate] = useState(expenseToEdit?.date ?? getToday)
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const isEditing = expenseToEdit !== null
  const selectedDate = isValidDate(date) ? toCalendarDate(date) : undefined

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    const parsedAmount = Number(amount)

    if (!description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.'
    }

    if (!category.trim()) {
      nextErrors.category = 'Category is required.'
    }

    if (!isValidDate(date)) {
      nextErrors.date = 'Enter a valid date.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      description: description.trim(),
      amount: parsedAmount,
      category: category.trim(),
      date,
    })

    if (!isEditing) {
      setDescription('')
      setAmount('')
      setCategory('')
      setDate(getToday())
    }

    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit expense' : 'Add an expense'}</CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update the details for this expense.'
              : 'Record an expense to keep track of your spending.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              className="h-10"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-describedby={
                errors.description ? 'description-error' : undefined
              }
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p className="text-sm text-destructive" id="description-error">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                className="h-10"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && (
                <p className="text-sm text-destructive" id="amount-error">
                  {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="w-full data-[size=default]:h-10"
                  aria-describedby={errors.category ? 'category-error' : undefined}
                  aria-invalid={Boolean(errors.category)}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  {expenseCategories.map((expenseCategory) => (
                    <SelectItem key={expenseCategory} value={expenseCategory}>
                      {expenseCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive" id="category-error">
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover
              open={isDatePopoverOpen}
              onOpenChange={setIsDatePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-start text-left font-normal"
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  aria-invalid={Boolean(errors.date)}
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(nextDate) => {
                    if (nextDate) {
                      setDate(format(nextDate, 'yyyy-MM-dd'))
                      setIsDatePopoverOpen(false)
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive" id="date-error">
                {errors.date}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="gap-3">
          {isEditing && (
            <Button
              className="h-10 flex-1"
              type="button"
              variant="outline"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          )}
          <Button
            className={
              isEditing
                ? 'h-10 flex-1 bg-amber-400 text-amber-950 hover:bg-amber-500'
                : 'h-10 flex-1'
            }
            type="submit"
          >
            {isEditing ? 'Save changes' : 'Add expense'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default ExpenseForm
