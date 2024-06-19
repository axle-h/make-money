import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ResponsiveContainer, Brush,
} from 'recharts'
import {CREDIT_COLOR_CSS, DEBIT_COLOR_CSS, TimeSeriesEntry} from "@/components/charts/data";
import {Box, useColorMode} from "@chakra-ui/react";
import {formatDateShort} from "@/components/dates";
import {currency} from "@/components/currency";

export function CurrencyBarChart({ data }: { data: TimeSeriesEntry[] }) {
    const { colorMode } = useColorMode()

    const stroke = colorMode === "light"
        ? 'var(--chakra-colors-black)'
        : 'var(--chakra-colors-white)'

    const strokeSubtle = colorMode === "light"
        ? 'var(--chakra-colors-gray-400)'
        : 'var(--chakra-colors-gray-600)'

    const chartData = data
        .map(({ date, credit, debit }) => ({
            date: formatDateShort(date),
            credit: Math.abs(credit),
            debit: Math.abs(debit)
        }))

    const interval = data.length > 60
        ? 3
        : data.length > 31
            ? 2
            : data.length > 15
                ? 1
                : 0

    return (
        <Box mb={6} w="100%">
            <ResponsiveContainer width="100%" height={500}>
                <BarChart
                    data={chartData}
                    barCategoryGap={2}
                    barGap={0}
                    margin={{
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 50,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={strokeSubtle} />
                    <XAxis dataKey="date" stroke={stroke} interval={interval} angle={-45} textAnchor="end" />
                    <YAxis stroke={stroke} tickFormatter={value => currency(value, 0)} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: colorMode === 'dark' ? 'var(--chakra-colors-gray-800)' : 'var(--chakra-colors-gray-100)'
                        }}
                        itemStyle={{
                            color: stroke
                        }}
                        cursor={{
                            fill: colorMode === 'dark' ? 'var(--chakra-colors-gray-600)' : 'var(--chakra-colors-gray-200)'
                        }}
                        formatter={v => currency(v as number)}
                    />
                    <Legend stroke={stroke} wrapperStyle={{bottom: 0}}  />
                    <ReferenceLine y={0} stroke={stroke} />
                    <Bar name="Credit" dataKey="credit" fill={CREDIT_COLOR_CSS} />
                    <Bar name="Debit" dataKey="debit" fill={DEBIT_COLOR_CSS} />
                </BarChart>
            </ResponsiveContainer>
        </Box>

    )
}