'use client'

import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {currency} from "@/components/currency";
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
            <ResponsiveContainer width="100%" height={500}>
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
                        formatter={v => currency(v as number)}
                    />
                    <Legend formatter={(v, { payload }) => {
                        const entry = payload as unknown as FrequencyTableEntry
                        return `${entry.label}: ${currency(entry.value)} (${entry.percent}%)`
                    }} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    )
}

