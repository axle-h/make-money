'use client'

import {
    Flex,
    FormControl,
    Heading,
    NumberDecrementStepper, NumberIncrementStepper,
    NumberInput,
    NumberInputField, NumberInputStepper,
    Select
} from "@chakra-ui/react";
import {ErrorAlert, Loading, NoData, StatementAlerts} from "@/components/alert";
import {useAccounts, useCategorizedTransactions} from "@/api-client";
import { getCurrentTaxYear, getTaxYears} from "@/components/dates";
import {useState} from "react";
import {CategorizedTransactionQuery} from "@/app/api/schema";
import {cumulativeTimeSeries} from "@/components/charts/data";
import {CurrencyBenchmarkLineChart} from "@/components/charts/currency-benchmark-line-chart";
import {currency} from "@/components/currency";

export default function IncomePage() {
    const [query, setQuery] = useState<CategorizedTransactionQuery>({
        ...getCurrentTaxYear().query,
        subCategories: false
    })
    const [benchmark, setBenchmark] = useState(100000)

    return (
        <>
            <StatementAlerts />
            <Heading mb={4}>Income</Heading>
            <IncomeFilters query={query} onChangeQuery={setQuery} benchmark={benchmark} onChangeBenchmark={setBenchmark} />
            <IncomeReport query={query} benchmark={benchmark} />
        </>
    )
}

interface IncomeFiltersProps {
    query: CategorizedTransactionQuery
    onChangeQuery(query: CategorizedTransactionQuery): void
    benchmark: number
    onChangeBenchmark(benchmark: number): void
}

function IncomeFilters({ query, onChangeQuery, benchmark, onChangeBenchmark }: IncomeFiltersProps) {
    const { accounts = [], isLoading, error } = useAccounts()

    const firstStatementStart = accounts.reduce((agg, { statementsFrom }) =>
        !statementsFrom ? agg
            : !agg ? statementsFrom
                : statementsFrom < agg ? statementsFrom : agg, null as Date | null)

    const taxYears = firstStatementStart ? getTaxYears(firstStatementStart) : [getCurrentTaxYear()]

    return (
        <Flex mb={4} justifyContent="space-between" gap={2} flexDirection={{ base: 'column', sm: 'row' }}>
            <FormControl>
                <Select onChange={ev => onChangeQuery({
                    ...query,
                    ...taxYears.find(x => x.name === ev.target.value)?.query!
                })}>
                    {taxYears.map(({ name }) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </Select>
            </FormControl>

            <FormControl maxW={{ base: 'initial', sm: 200 }}>
                <NumberInput
                    min={1000}
                    step={1000}
                    value={currency(benchmark, 0)}
                    onChange={(_, valueAsNumber) => onChangeBenchmark(valueAsNumber)}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </FormControl>
        </Flex>
    )
}

function IncomeReport({ query, benchmark }: { query: CategorizedTransactionQuery, benchmark: number }) {
    const { transactions = [], isLoading, error } = useCategorizedTransactions(query)

    if (isLoading || !query.dateFrom || !query.dateTo) {
        return <Loading />
    }

    if (error) {
        return <ErrorAlert error={error} />
    }

    if (transactions.length === 0) {
        return <NoData />
    }

    // TODO do this on the server
    const income = transactions.filter(t => t.categoryType === 'INCOME')

    return (
        <CurrencyBenchmarkLineChart
            dataKey="credit"
            data={cumulativeTimeSeries(income, query.dateFrom, query.dateTo, 'months')}
            benchmark={benchmark}
        />
    )
}