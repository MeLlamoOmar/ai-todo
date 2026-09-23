import { format } from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import type { TransactionType } from '../types/transaction'
import type { TransactionDateRange } from '../utils/transactionDateRangeFilter'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export type TransactionTypeFilter = TransactionType | 'all'

type TransactionFiltersProps = {
  type: TransactionTypeFilter
  category: string
  dateRange?: TransactionDateRange
  categoryOptions: readonly string[]
  hasActiveFilters: boolean
  onTypeChange: (type: TransactionTypeFilter) => void
  onCategoryChange: (category: string) => void
  onDateRangeChange: (range?: TransactionDateRange) => void
  onClear: () => void
}

function toLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function toCalendarRange(range?: TransactionDateRange): DateRange | undefined {
  if (!range) {
    return undefined
  }

  return {
    from: toLocalDate(range.startDate),
    to: toLocalDate(range.endDate),
  }
}

function formatDateRange(range?: TransactionDateRange) {
  if (!range) {
    return 'All dates'
  }

  const startDate = toLocalDate(range.startDate)
  const endDate = toLocalDate(range.endDate)

  if (range.startDate === range.endDate) {
    return format(startDate, 'MMM d, yyyy')
  }

  return `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`
}

function TransactionFilters({
  type,
  category,
  dateRange,
  categoryOptions,
  hasActiveFilters,
  onTypeChange,
  onCategoryChange,
  onDateRangeChange,
  onClear,
}: TransactionFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() =>
    toCalendarRange(dateRange),
  )

  function handleCalendarOpenChange(open: boolean) {
    setIsCalendarOpen(open)

    if (open) {
      setDraftRange(toCalendarRange(dateRange))
    }
  }

  function handleDateRangeChange(nextRange: DateRange | undefined) {
    setDraftRange(nextRange)

    if (!nextRange?.from) {
      onDateRangeChange(undefined)
      return
    }

    const startDate = format(nextRange.from, 'yyyy-MM-dd')
    const endDate = format(nextRange.to ?? nextRange.from, 'yyyy-MM-dd')

    onDateRangeChange({ startDate, endDate })

    if (nextRange.to) {
      setIsCalendarOpen(false)
    }
  }

  function handleClear() {
    setDraftRange(undefined)
    onClear()
  }

  return (
    <fieldset className="grid gap-3 border-b pb-5 sm:grid-cols-2">
      <legend className="sr-only">Transaction filters</legend>
      <div className="space-y-2">
        <Label htmlFor="transaction-type-filter">Type</Label>
        <Select
          value={type}
          onValueChange={(value) => {
            if (value === 'all' || value === 'income' || value === 'expense') {
              onTypeChange(value)
            }
          }}
        >
          <SelectTrigger
            id="transaction-type-filter"
            className="w-full data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="start">
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-category-filter">Category</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger
            id="transaction-category-filter"
            className="w-full data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="start">
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((categoryOption) => (
              <SelectItem key={categoryOption} value={categoryOption}>
                {categoryOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-date-filter">Date range</Label>
        <Popover
          open={isCalendarOpen}
          onOpenChange={handleCalendarOpenChange}
        >
          <PopoverTrigger asChild>
            <Button
              id="transaction-date-filter"
              type="button"
              variant="outline"
              className="h-10 w-full justify-start overflow-hidden text-left font-normal"
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{formatDateRange(dateRange)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-10 sm:self-end"
        disabled={!hasActiveFilters}
        onClick={handleClear}
      >
        <XIcon className="size-4" />
        Clear filters
      </Button>
    </fieldset>
  )
}

export default TransactionFilters
