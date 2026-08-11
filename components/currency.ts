import { Decimal } from '@prisma/client-runtime-utils'

const SYMBOL = '£'

export function currency(
  value: Decimal | number | string,
  decimalPlaces: number = 2
): string {
  if (typeof value === 'string') {
    value = new Decimal(value)
  }
  const isNegative = typeof value === 'number' ? value < 0 : value.isNeg()
  if (isNegative) {
    return (
      '-' + SYMBOL + numberWithCommas(value.toFixed(decimalPlaces).substring(1))
    )
  }
  return SYMBOL + numberWithCommas(value.toFixed(decimalPlaces))
}

export function currencyShort(value: Decimal | number | string): string {
  if (typeof value === 'string') {
    value = new Decimal(value)
  }
  const isSmall = typeof value === 'number' ? value < 1000 : value.lt(1000)
  if (isSmall) {
    return currency(value, 0)
  }

  const thousands = typeof value === 'number' ? value / 1000 : value.div(1000)
  return currency(thousands, 1) + 'k'
}

function numberWithCommas(x: string) {
  return x.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
