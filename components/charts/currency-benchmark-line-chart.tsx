import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import {CREDIT_COLOR_CSS, OTHER_COLOR_CSS, TimeSeriesEntry} from "@/components/charts/data";
import {formatMonthAndYear, utcNow} from "@/components/dates";
import { isBefore } from 'date-fns'
import { Prisma } from '@prisma/client';
import {useBreakpointValue, useColorMode} from "@chakra-ui/react";
import {currency, currencyShort} from "@/components/currency";

export interface CurrencyBenchmarkLineChartProps {
    data: TimeSeriesEntry[]
    dataKey: 'credit' | 'debit'
    benchmark: number | Prisma.Decimal
}

export function CurrencyBenchmarkLineChart({ data, dataKey, benchmark }: CurrencyBenchmarkLineChartProps) {
    const interval = useBreakpointValue({ base: 1, lg: 0 }, { ssr: false })
    const { colorMode } = useColorMode()

    const stroke = colorMode === "light"
        ? 'var(--chakra-colors-black)'
        : 'var(--chakra-colors-white)'

    const strokeSubtle = colorMode === "light"
        ? 'var(--chakra-colors-gray-400)'
        : 'var(--chakra-colors-gray-600)'

    const now = utcNow()

    const benchmarkDecimal = new Prisma.Decimal(benchmark)

    const chartData = data
        .map(({ date, [dataKey]: amount }, index) => ({
            date: formatMonthAndYear(date),
            amount: isBefore(date, now) ? Math.abs(amount) : undefined,
            benchmark: benchmarkDecimal.div(12).mul((index + 1)).toFixed(2)
        }))

    return (
        <ResponsiveContainer width="100%" height={600}>
            <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 30,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={strokeSubtle} />
                <XAxis dataKey="date" stroke={stroke} interval={interval} textAnchor="middle" />
                <YAxis stroke={stroke} tickFormatter={value => currencyShort(value)} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: colorMode === 'dark' ? 'var(--chakra-colors-gray-800)' : 'var(--chakra-colors-gray-100)'
                    }}
                    itemStyle={{
                        color: stroke
                    }}
                    formatter={v => currency(v as number)}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="amount"
                    name={dataKey[0].toUpperCase() + dataKey.substring(1)}
                    stroke={CREDIT_COLOR_CSS}
                    fill={CREDIT_COLOR_CSS}
                />
                <Line
                    type="monotone"
                    dataKey="benchmark"
                    name="Benchmark"
                    stroke={OTHER_COLOR_CSS}
                    fill={OTHER_COLOR_CSS}
                    strokeDasharray="5 5"
                />

            </LineChart>
        </ResponsiveContainer>
    )
}