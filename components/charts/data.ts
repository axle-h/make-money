import {CategorizedTransaction} from "@/app/api/schema";
import {Prisma} from "@prisma/client";
import {compareAsc, isEqual, add as addDuration, Duration, DurationUnit, isBefore, startOfDay} from "date-fns";
import {addAmount, startOf} from "@/components/dates";

export function* generateColors(): Generator<string> {
    const colors = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink']
    const shades = [500, 600, 400, 700, 300, 800, 200, 900]
    while (true) {
        for (let shade of shades) {
            for (let color of colors) {
                yield `var(--chakra-colors-${color}-${shade})`
            }
        }
    }
}

const OTHER_LABEL = 'Other'
const OTHER_EMOJI = '❔'
export const OTHER_COLOR_CSS = 'var(--chakra-colors-gray-400)'

export const CREDIT_COLOR = 'green.500'
export const CREDIT_COLOR_CSS = `var(--chakra-colors-${CREDIT_COLOR.replace('.', '-')})`

export const DEBIT_COLOR = 'red.500'
export const DEBIT_COLOR_CSS = `var(--chakra-colors-${DEBIT_COLOR.replace('.', '-')})`

export function sumTotal(
    transactions: CategorizedTransaction[],
    prop: 'credit' | 'debit',
): number {
    return transactions
        .reduce((sum, { [prop]: amount }) => sum.add(amount), new Prisma.Decimal(0))
        .toNumber()
}

export interface FrequencyTableEntry {
    label: string
    emoji: string | null
    value: number
    percent: number
    color: string
}

export function aggregateByCategory(
    transactions: CategorizedTransaction[],
    limit: number = 8,
): FrequencyTableEntry[] {
    const flatTransactions = transactions
        .map(({ category, emoji, credit, debit }) => ({
            category,
            emoji,
            amount: credit.plus(debit)
        }))
        .filter(({ amount }) => !amount.eq(0))

    const total = flatTransactions
        .reduce((sum, { amount }) => sum.add(amount), new Prisma.Decimal(0))
        .abs()

    if (total.isZero()) {
        return []
    }

    const byCategory = flatTransactions
        .reduce((agg, { category, emoji, amount }) => {
            const key = `${category}:${emoji || ''}`
                if (key in agg) {
                    agg[key] = agg[key].add(amount.abs())
                } else {
                    agg[key] = amount.abs()
                }
                return agg
            },
            {} as Record<string, Prisma.Decimal>
        )

    const colors = generateColors()
    const decimalData = Object.entries(byCategory)
        .map(([key, value]) => {
            const [label, emoji] = key.split(':')
            return {
                label,
                emoji: emoji || null,
                value,
                percent: value.div(total).mul(100),
                color: colors.next().value
            }
        })
        .sort((a, b) => b.value.cmp(a.value))


    if (decimalData.length > limit) {
        const otherData = decimalData.splice(limit - 1)
        decimalData.push({
            label: OTHER_LABEL,
            emoji: OTHER_EMOJI,
            value: otherData.reduce((a, b) => a.add(b.value), new Prisma.Decimal(0)),
            percent: otherData.reduce((a, b) => a.add(b.percent), new Prisma.Decimal(0)),
            color: OTHER_COLOR_CSS
        })
    }

    return decimalData.map(({ value, percent, ...rest }) => ({
        ...rest,
        value: value.toNumber(),
        percent: percent.toDecimalPlaces(1).toNumber(),
    }))
}

export interface TimeSeriesEntry<Money = number> {
    date: Date
    credit: Money
    debit: Money
}

export function timeSeriesDecimal(
    transactions: CategorizedTransaction[],
    startDate: Date,
    endDate: Date,
    period: DurationUnit = 'days'
): TimeSeriesEntry<Prisma.Decimal>[] {
    if (transactions.length === 0) {
        return []
    }

    const startDateInclusive = startOf(startDate, period)
    const endDateExclusive = addAmount(startOf(endDate, period), 1, period)
    const data: TimeSeriesEntry<Prisma.Decimal>[] = transactions
        .filter(x => x.date >= startDateInclusive && x.date < endDateExclusive)
        .map(({ date, credit, debit }) => ({ date, credit, debit }))
        .sort((a, b) => compareAsc(a.date, b.date))
        .reduce((agg, current) => {
            if (agg.length === 0) {
                return [current]
            }
            const last = agg[agg.length - 1]
            if (isEqual(current.date, last.date)) {
                last.credit = last.credit.add(current.credit)
                last.debit = last.debit.add(current.debit)
            } else {
                agg.push(current)
            }

            return agg
        }, [] as TimeSeriesEntry<Prisma.Decimal>[])

    const periodDuration: Duration = { [period]: 1 }

    function* flatten(): Generator<TimeSeriesEntry<Prisma.Decimal>> {
        let index = 0
        let date = startDateInclusive
        let prev: TimeSeriesEntry<Prisma.Decimal> | null = null

        while (date <= endDate) {
            const nextDate = addDuration(date, periodDuration)
            let current = index < data.length ? data[index] : null

            if (current && (isBefore(current.date, nextDate))) {
                if (prev && prev.date === date) {
                    prev.credit = prev.credit.plus(current.credit)
                    prev.debit = prev.debit.plus(current.debit)
                } else {
                    yield prev = { ...current, date }
                }
                index += 1
            } else if (prev && prev.date === date) {
                date = nextDate
            } else {
                yield prev = { date, credit: new Prisma.Decimal(0), debit: new Prisma.Decimal(0) }
                date = nextDate
            }
        }
    }

    return [...flatten()]
}

export function timeSeries(
    transactions: CategorizedTransaction[],
    startDate: Date,
    endDate: Date,
    period: DurationUnit = 'days'
): TimeSeriesEntry[] {
    return timeSeriesDecimal(transactions, startDate, endDate, period).map(toNumberEntry)
}

export function cumulativeTimeSeries(
    transactions: CategorizedTransaction[],
    startDate: Date,
    endDate: Date,
    period: DurationUnit = 'days'
): TimeSeriesEntry[] {
    return timeSeriesDecimal(transactions, startDate, endDate, period)
        .reduce((series, current) => {
            if (series.length === 0) {
                return [current]
            }
            const last = series[series.length - 1]

            series.push({
                date: current.date,
                credit: current.credit.add(last.credit),
                debit: current.debit.add(last.debit),
            })
            return series
        }, [] as TimeSeriesEntry<Prisma.Decimal>[])
        .map(toNumberEntry)

}

function toNumberEntry(entry: TimeSeriesEntry<Prisma.Decimal>): TimeSeriesEntry {
    return {
        date: entry.date,
        credit: entry.credit.toNumber(),
        debit: entry.debit.toNumber()
    }
}