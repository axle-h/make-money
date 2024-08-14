import {aggregateByCategory, FrequencyTableEntry, timeSeries, TimeSeriesEntry} from "@/components/charts/data"
import {CategorizedTransaction, CategoryType} from "@/app/api/schema"
import {parseUtcDateShort} from "@/components/dates"
import {Prisma} from "@prisma/client"


export type Stringified<T> = {
    [k in keyof(T)]: (T[k] extends Date
        ? string
        : T[k] extends Prisma.Decimal
            ? (Prisma.Decimal | number | string)
            : T[k] extends CategoryType
                ? (CategoryType | string)
                : T[k]);
}

type PartialCategorizedTransaction = Partial<Stringified<CategorizedTransaction>>

function transaction(partial: PartialCategorizedTransaction): CategorizedTransaction {
    return {
        date: parseUtcDateShort(partial.date || '2024-06-09'),
        emoji: partial.emoji || null,
        category: partial.category || 'Leisure',
        categoryType: (partial.categoryType || 'EXPENSE') as CategoryType,
        credit: new Prisma.Decimal(partial.credit || 0),
        debit: new Prisma.Decimal(partial.debit || 0),
    }
}

function transactions(partials: PartialCategorizedTransaction[]): CategorizedTransaction[] {
    return partials.map(transaction)
}

describe('data', () => {
    describe('aggregate by category', () => {

        const expense1s = transactions([
            { debit: -10, category: 'EXPENSE1' },
            { debit: -20, category: 'EXPENSE1' }
        ])

        const expense2s = transactions([
            { debit: -100, category: 'EXPENSE2' },
            { debit: -200, category: 'EXPENSE2' }
        ])

        it('empty', () => {
            expect(aggregateByCategory([])).toEqual([])
        })

        it('aggregates to single', () => {
            const expected: FrequencyTableEntry[] = [
                {
                    label: 'EXPENSE1',
                    emoji: null,
                    percent: 100,
                    color: 'var(--chakra-colors-red-500)',
                    value: 30
                }
            ]
            expect(aggregateByCategory(expense1s)).toEqual(expected)
        })

        it('aggregates to multiple, orders largest to smallest', () => {
            const expected: FrequencyTableEntry[] = [
                {
                    label: 'EXPENSE2',
                    emoji: null,
                    percent: 90.9,
                    color: 'var(--chakra-colors-orange-500)',
                    value: 300
                },
                {
                    label: 'EXPENSE1',
                    emoji: null,
                    percent: 9.1,
                    color: 'var(--chakra-colors-red-500)',
                    value: 30
                }
            ]
            expect(aggregateByCategory([...expense1s, ...expense2s])).toEqual(expected)
        })

        it('collapses to other', () => {
            const expected: FrequencyTableEntry[] = [
                {
                    label: 'Holidays',
                    emoji: null,
                    color: 'var(--chakra-colors-red-500)',
                    value: 3367.57,
                    percent: 59.1
                },
                {
                    label: 'Home Improvement',
                    emoji: null,
                    color: 'var(--chakra-colors-orange-500)',
                    value: 2234.92,
                    percent: 39.2
                },
                {
                    label: 'Other',
                    emoji: '❔',
                    color: 'var(--chakra-colors-gray-400)',
                    value: 94.14,
                    percent: 1.7
                }
            ]

            const observed = aggregateByCategory(transactions([
                { category: 'Holidays', debit: '-163.03' },
                { category: 'Holidays', debit: '-3204.54' },
                { category: 'Home Improvement', debit: '-2234.92' },
                { category: 'Leisure', debit: '-19.45' },
                { category: 'Leisure', debit: '-12.5' },
                { category: 'Food', debit: '-10.2' },
                { category: 'Things', debit: '-7.99' },
                { category: 'Vanity', debit: '-44' },
            ]), 3)

            expect(observed).toEqual(expected)
        })
    })

    describe('time series', () => {
        it('aggregates to day', () => {
            const observed = timeSeries(transactions([
                { date: '2024-06-09', debit: -19.45 },
                { date: '2024-06-10', debit: -12.5 },
                { date: '2024-06-10', debit: -10.2 },
                { date: '2024-06-10', debit: -7.99 },
                { date: '2024-06-10', credit: 1.23 },
            ]), parseUtcDateShort('2024-06-09'), parseUtcDateShort('2024-06-10'))

            timeSeriesShouldBe(observed, [
                { date: '2024-06-09', credit: 0, debit: -19.45 },
                { date: '2024-06-10', credit: 1.23, debit: -30.69 },
            ])
        })

        it('fills in time range with 0s', () => {
            const observed = timeSeries(transactions([
                { date: '2024-06-09', debit: -19.45 },
            ]), parseUtcDateShort('2024-06-09'), parseUtcDateShort('2024-06-10'))

            timeSeriesShouldBe(observed, [
                { date: '2024-06-09', credit: 0, debit: -19.45 },
                { date: '2024-06-10', credit: 0, debit: 0 },
            ])
        })

        it('aggregates to weeks', () => {
            const observed = timeSeries(transactions([
                    { date: '2024-08-05', debit: -10.2 },
                    { date: '2024-08-05', debit: -7.99 },
                    { date: '2024-08-06', credit: 1.23 },
                    { date: '2024-08-13', debit: -19.45 },
                    { date: '2024-08-14', debit: -12.5 },
                ]), parseUtcDateShort('2024-07-31'), // 2 weeks ago
                parseUtcDateShort('2024-08-14'),
                'weeks')

            timeSeriesShouldBe(observed, [
                { date: '2024-07-29', credit: 0, debit: 0 },
                { date: '2024-08-05', credit: 1.23, debit: -18.19 },
                { date: '2024-08-12', credit: 0, debit: -31.95 },
            ])
        })

        it('aggregates to months', () => {
            const observed = timeSeries(transactions([
                    { date: '2024-08-05', debit: -10.2 },
                    { date: '2024-08-05', debit: -7.99 },
                    { date: '2024-07-06', credit: 1.23 },
                    { date: '2024-07-13', debit: -19.45 },
                    { date: '2024-07-14', debit: -12.5 },
                ]), parseUtcDateShort('2024-07-01'), // 2 weeks ago
                parseUtcDateShort('2024-08-31'),
                'months')

            timeSeriesShouldBe(observed, [
                { date: '2024-07-01', credit: 1.23, debit: -31.95 },
                { date: '2024-08-01', credit: 0, debit: -18.19 },
            ])
        })

        function timeSeriesShouldBe(observed: TimeSeriesEntry[], expected: Stringified<TimeSeriesEntry>[]) {
            expect(observed.map(({date, ...t}) => ({
                ...t,
                date: date.toISOString().substring(0, 10)
            }))).toEqual(expected)
        }
    })
})
