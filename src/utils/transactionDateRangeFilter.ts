export type TransactionDateRange = {
  startDate: string
  endDate: string
}

export function isTransactionDateInRange(
  date: string,
  range?: TransactionDateRange,
) {
  if (!range) {
    return true
  }

  return date >= range.startDate && date <= range.endDate
}
