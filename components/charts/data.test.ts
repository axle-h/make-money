import {aggregateByCategory, FrequencyTableEntry} from "@/components/charts/data"
import {CategorizedTransaction, CategoryType} from "@/app/api/schema"
import {parseIsoUtcDate} from "@/components/dates"
import {Prisma} from "@prisma/client"
import exampleData from './example-expenses.json'

describe('data', () => {
    describe('aggregate by category', () => {
        const expense1s: CategorizedTransaction[] = [
            {
                date: parseIsoUtcDate('2024-01-01'),
                debit: new Prisma.Decimal(10),
                credit: new Prisma.Decimal(0),
                category: 'EXPENSE1',
                categoryType: 'EXPENSE'
            },
            {
                date: parseIsoUtcDate('2024-01-02'),
                debit: new Prisma.Decimal(20),
                credit: new Prisma.Decimal(0),
                category: 'EXPENSE1',
                categoryType: 'EXPENSE'
            }
        ]
        const expense2s: CategorizedTransaction[] = [
            {
                date: parseIsoUtcDate('2024-01-03'),
                debit: new Prisma.Decimal(100),
                credit: new Prisma.Decimal(0),
                category: 'EXPENSE2',
                categoryType: 'EXPENSE'
            },
            {
                date: parseIsoUtcDate('2024-01-03'),
                debit: new Prisma.Decimal(200),
                credit: new Prisma.Decimal(0),
                category: 'EXPENSE2',
                categoryType: 'EXPENSE'
            }
        ]

        it('empty', () => {
            expect(aggregateByCategory([])).toEqual([])
        })

        it('aggregates to single', () => {
            const expected: FrequencyTableEntry[] = [
                {
                    label: 'EXPENSE1',
                    percent: 100,
                    color: 'var(--chakra-colors-red-500)',
                    value: 30
                }
            ]
            expect(aggregateByCategory(expense1s)).toEqual(expected)
        })

        it('aggregates to multiple', () => {
            const expected: FrequencyTableEntry[] = [
                {
                    label: 'EXPENSE2',
                    percent: 90.9,
                    color: 'var(--chakra-colors-orange-500)',
                    value: 300
                },
                {
                    label: 'EXPENSE1',
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
                    color: 'var(--chakra-colors-teal-600)',
                    value: 3367.5725,
                    percent: 41.9
                },
                {
                    label: 'Home Improvement',
                    color: 'var(--chakra-colors-green-500)',
                    value: 2234.9175,
                    percent: 27.8
                },
                {
                    label: 'Leisure',
                    color: 'var(--chakra-colors-red-500)',
                    value: 729.72,
                    percent: 9.1
                },
                {
                    label: 'Food',
                    color: 'var(--chakra-colors-orange-500)',
                    value: 542.03,
                    percent: 6.7
                },
                {
                    label: 'Clothing',
                    color: 'var(--chakra-colors-red-600)',
                    value: 363.58,
                    percent: 4.5
                },
                {
                    label: 'Vanity',
                    color: 'var(--chakra-colors-teal-500)',
                    value: 215.21,
                    percent: 2.7
                },
                {
                    label: 'Cleaning',
                    color: 'var(--chakra-colors-blue-500)',
                    value: 196,
                    percent: 2.4
                },
                {
                    label: 'Other',
                    color: 'var(--chakra-colors-gray-400)',
                    value: 405.44,
                    percent: 5
                }
            ]

            const exampleTransactions = exampleData.map(({ date, credit, debit, categoryType, ...item }) => ({
                ...item,
                date: parseIsoUtcDate(date),
                credit: new Prisma.Decimal(credit),
                debit: new Prisma.Decimal(debit),
                categoryType: categoryType as CategoryType
            }))

            expect(aggregateByCategory(exampleTransactions)).toEqual(expected)
        })
    })

})