'use client'

import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {currency, currencyShort} from "@/components/currency";
import {FrequencyTableEntry} from "@/components/charts/data";
import {Box, useColorMode} from "@chakra-ui/react";

export function CurrencyPieChart({data}: { data: FrequencyTableEntry[] }) {
    const { colorMode } = useColorMode()

    const stroke = colorMode === "light"
        ? 'var(--chakra-colors-black)'
        : 'var(--chakra-colors-white)'

    const strokeAlt = colorMode === "light"
        ? 'var(--chakra-colors-white)'
        : 'var(--chakra-colors-black)'

    return (
        <Box mb={6} w="100%">
            <ResponsiveContainer width="100%" height={550}>
                <PieChart>
                    <Pie
                        data={data}
                        outerRadius={150}
                        dataKey="value"
                        label={entry => entry.label}
                        stroke={strokeAlt}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                name={entry.label}
                                key={`cell-${index}`}
                                fill={entry.color}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: colorMode === 'dark' ? 'var(--chakra-colors-gray-800)' : 'var(--chakra-colors-gray-100)'
                        }}
                        itemStyle={{
                            color: stroke
                        }}
                        formatter={(_1, _2, { payload }) => label(payload as FrequencyTableEntry)}
                    />
                    <Legend formatter={(_, { payload }) => {
                        const entry = payload as unknown as FrequencyTableEntry
                        return `${entry.label} ${label(entry)}`
                    }} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    )
}

function label(entry: FrequencyTableEntry) {
    return `${currencyShort(entry.value)} (${formatPercent(entry.percent)})`
}

function formatPercent(percent: number): string {
    const rounded = percent < 1 ? percent : Math.round(percent)
    return `${rounded}%`
}
