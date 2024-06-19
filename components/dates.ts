import {
    format,
    formatISO,
    addMonths,
    subMonths,
    addDays,
    differenceInMonths,
    startOfToday,
    startOfMonth,
    getYear,
    differenceInDays,
    parse as parseDate,
    parseISO,
    isBefore,
    isAfter,
    isEqual, startOfDay
} from "date-fns"
import { UTCDate } from "@date-fns/utc"
import { enGB } from 'date-fns/locale/en-GB'
import {fromZonedTime} from "date-fns-tz";

export function formatDateTimeLong(date: Date) {
    return format(date, 'PPpp', { locale: enGB })
}

export function formatDateLong(date: Date) {
    return format(date, 'PP', { locale: enGB })
}

export function formatDateShort(date: Date) {
    return format(date, 'dd MMM yy', { locale: enGB })
}

export function formatDateTiny(date: Date) {
    return format(date, 'dd MMM', { locale: enGB })
}

export function formatMonthAndYear(date: Date) {
    return format(date, 'MMM yy', { locale: enGB })
}

export function formatDateIso(date: Date) {
    return formatISO(date, { representation: 'date' })
}

export function needsNewStatement(lastStatementEnd: Date): boolean {
    return differenceInMonths(startOfToday(), lastStatementEnd) >= 1
}

export interface DateRange {
    dateFrom: Date
    dateTo: Date
}

export function utcNow() {
    return new UTCDate(UTCDate.now())
}

function getTaxYearOfDate(date: Date): number {
    return isAfter(date, new UTCDate(UTCDate.UTC(date.getUTCFullYear(), 3, 6, 0, 0, 0, 0)))
        ? date.getUTCFullYear()
        : date.getUTCFullYear() - 1
}

export interface TaxYear {
    name: string
    query: DateRange
}

const CURRENT_TAX_YEAR_LABEL = 'Current tax year so far'

export function getCurrentTaxYear(now: Date = utcNow()): TaxYear {
    return {
        name: CURRENT_TAX_YEAR_LABEL,
        query: getTaxYear(getTaxYearOfDate(now))
    }
}

export function getTaxYears(startDate: Date, now: Date = utcNow()): TaxYear[] {
    const result: TaxYear[] = []

    const currentTaxYear = getTaxYearOfDate(now)
    for (let year = currentTaxYear; year >= getTaxYearOfDate(startDate); year--) {
        result.push({
            name: year === currentTaxYear ? CURRENT_TAX_YEAR_LABEL : `Tax year ${year}/${year - 2000 + 1}`,
            query: getTaxYear(year)
        })
    }

    return result
}

export function getTaxYear(year: number): DateRange {
    return {
        dateFrom: new UTCDate(UTCDate.UTC(year, 3, 6, 0, 0, 0, 0)),
        dateTo: new UTCDate(UTCDate.UTC(year + 1, 3, 6, 0, 0, 0, 0))
    }
}

export function formatDateRange(start: Date, end: Date): string {
    if (differenceInDays(end, start) <= 1) {
        return formatDateShort(start)
    }

    const currentYear = getYear(new UTCDate())
    const yearFrom = getYear(start)
    const yearTo = getYear(end)
    const dates = yearFrom === currentYear && yearTo === currentYear
        ? [formatDateTiny(start), formatDateTiny(end)]
        : yearTo === currentYear
            ? [formatDateShort(start), formatDateTiny(end)]
            : [formatDateShort(start), formatDateShort(end)]
    return dates.join(' to ')
}

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone
const REFERENCE_UTC = fromZonedTime(new UTCDate(0), TIME_ZONE)

export function parseIsoUtcDate(dateString: string | Date): Date {
    const zoned = dateString instanceof Date ? dateString : parseISO(dateString)
    return new UTCDate(fromZonedTime(zoned, TIME_ZONE))
}

export function parseUtcDate(dateString: string, formatString: string) {
    const zoned = parseDate(dateString, formatString, REFERENCE_UTC)
    return new UTCDate(fromZonedTime(zoned, 'Etc/UTC'))
}

export function getRangeMonthsToNow(months: number, now: Date = utcNow()): DateRange {
    const nowMidnight = startOfDay(now)
    return {
        dateFrom: addMonths(nowMidnight, -months),
        dateTo: nowMidnight
    }
}