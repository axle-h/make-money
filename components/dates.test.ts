import {parseIsoUtcDate, getTaxYears, getRangeMonthsToNow} from "@/components/dates";
import {UTCDate} from "@date-fns/utc";

describe('dates', () => {
    it('parses utc date', () => {
        expect(parseIsoUtcDate("2024-07-01T00:00:00.000Z").toISOString())
            .toBe('2024-07-01T00:00:00.000Z')
    })

    it('generates tax years', () => {
        const result = getTaxYears(
            parseIsoUtcDate("2023-01-01T00:00:00.000Z"),
            parseIsoUtcDate("2024-07-09T12:30:00.000Z")
        ).map(({ name, query: { dateFrom, dateTo } }) =>
            `${name}: ${dateFrom.toISOString()} - ${dateTo.toISOString()}`
        )
        expect(result).toEqual([
            'Current tax year so far: 2024-04-06T00:00:00.000Z - 2025-04-06T00:00:00.000Z',
            'Tax year 2023/24: 2023-04-06T00:00:00.000Z - 2024-04-06T00:00:00.000Z',
            'Tax year 2022/23: 2022-04-06T00:00:00.000Z - 2023-04-06T00:00:00.000Z'
        ])
    })

    it('gets range months to now', () => {
        const now = parseIsoUtcDate('2023-01-01T12:30:26.132Z')
        const { dateFrom, dateTo } = getRangeMonthsToNow(3, now)
        expect(dateFrom.toISOString()).toBe('2022-10-01T00:00:00.000Z')
        expect(dateTo.toISOString()).toBe('2023-01-01T00:00:00.000Z')
    })
})