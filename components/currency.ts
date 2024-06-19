import { Prisma } from '@prisma/client'

const SYMBOL = '£'

export function currency(value: Prisma.Decimal | number | string, decimalPlaces: number = 2): string {
    if (typeof value === 'string') {
        value = new Prisma.Decimal(value)
    }
    const isNegative = typeof value === 'number' ? value < 0 : value.isNeg()
    if (isNegative) {
        return '-' + SYMBOL + numberWithCommas(value.toFixed(decimalPlaces).substring(1))
    }
    return SYMBOL + numberWithCommas(value.toFixed(decimalPlaces))
}

export function currencyShort(value: Prisma.Decimal | number | string): string {
    return currency(value, 0).replace(/,000$/, 'k')
}

function numberWithCommas(x: string) {
    return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}