import {
  columnFilteringFeature,
  constructFilterFn,
  createColumnHelper,
  createFilteredRowModel,
  filterFn_equals,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { Transaction } from '../types/transaction'
import {
  allTransactionCategories,
  transactionCategories,
} from '../utils/transactionCategories'
import {
  isTransactionDateInRange,
  type TransactionDateRange,
} from '../utils/transactionDateRangeFilter'
import TransactionFilters, {
  type TransactionTypeFilter,
} from './TransactionFilters'
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

const filterByDateRange = constructFilterFn({
  filter: (date: string, range: TransactionDateRange) =>
    isTransactionDateInRange(date, range),
  autoRemove: (range?: TransactionDateRange) => !range,
})

const transactionTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    equals: filterFn_equals,
    dateRange: filterByDateRange,
  },
})

const columnHelper = createColumnHelper<
  typeof transactionTableFeatures,
  Transaction
>()

const columns = columnHelper.columns([
  columnHelper.accessor('type', { filterFn: 'equals' }),
  columnHelper.accessor('category', { filterFn: 'equals' }),
  columnHelper.accessor('date', { filterFn: 'dateRange' }),
  columnHelper.accessor('description', {}),
  columnHelper.accessor('amount', {}),
])

function TransactionList({
  transactions,
  onDelete,
  onEdit,
}: TransactionListProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const table = useTable({
    features: transactionTableFeatures,
    columns,
    data: transactions,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getRowId: (transaction) => transaction.id,
  })
  const filteredRows = table.getFilteredRowModel().rows
  const selectedType =
    (table.getColumn('type')?.getFilterValue() as
      | TransactionTypeFilter
      | undefined) ?? 'all'
  const selectedCategory =
    (table.getColumn('category')?.getFilterValue() as string | undefined) ??
    'all'
  const selectedDateRange = table
    .getColumn('date')
    ?.getFilterValue() as TransactionDateRange | undefined
  const categoryOptions =
    selectedType === 'all'
      ? allTransactionCategories
      : transactionCategories[selectedType]
  const hasActiveFilters = columnFilters.length > 0

  function handleTypeChange(nextType: TransactionTypeFilter) {
    table
      .getColumn('type')
      ?.setFilterValue(nextType === 'all' ? undefined : nextType)

    if (
      selectedCategory !== 'all' &&
      nextType !== 'all' &&
      !transactionCategories[nextType].includes(selectedCategory)
    ) {
      table.getColumn('category')?.setFilterValue(undefined)
    }
  }

  function handleCategoryChange(nextCategory: string) {
    table
      .getColumn('category')
      ?.setFilterValue(nextCategory === 'all' ? undefined : nextCategory)
  }

  function handleDateRangeChange(nextRange?: TransactionDateRange) {
    table.getColumn('date')?.setFilterValue(nextRange)
  }

  return (
    <section className="w-full" aria-labelledby="transactions-heading">
      <Card>
        <CardHeader className="border-b">
          <CardTitle id="transactions-heading">Recent transactions</CardTitle>
          <CardDescription>
            {transactions.length === 0
              ? 'Your recorded transactions will appear here.'
              : hasActiveFilters
                ? `${filteredRows.length} of ${transactions.length} transactions`
                : `${transactions.length} recorded transaction${transactions.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <TransactionFilters
            type={selectedType}
            category={selectedCategory}
            dateRange={selectedDateRange}
            categoryOptions={categoryOptions}
            hasActiveFilters={hasActiveFilters}
            onTypeChange={handleTypeChange}
            onCategoryChange={handleCategoryChange}
            onDateRangeChange={handleDateRangeChange}
            onClear={() => setColumnFilters([])}
          />

          {transactions.length === 0 ? (
            <p
              className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              No transactions yet. Add one to get started.
            </p>
          ) : filteredRows.length === 0 ? (
            <p
              className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              No transactions match the selected filters.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredRows.map((row) => (
                <TransactionItem
                  key={row.id}
                  transaction={row.original}
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
