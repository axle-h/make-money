'use client'

import {
    Avatar,
    AvatarBadge,
    Box,
    Button,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay, Flex,
    FormControl,
    FormLabel,
    Heading,
    IconButton,
    Select,
    SimpleGrid,
    Stack,
    Stat, StatArrow,
    StatLabel,
    StatNumber, Switch,
    useDisclosure
} from "@chakra-ui/react";
import React, {useState} from "react";
import {FilterIcon} from "@/components/icons";
import {CategorizedTransactionQuery, categoryTypeName} from "@/app/api/schema";
import {useAccounts, useCategorizedTransactions} from "@/api-client";
import {ErrorAlert, Loading, NoData, StatementAlerts} from "@/components/alert";
import {CurrencyPieChart} from "@/components/charts/currency-pie-chart";
import {aggregateByCategory, timeSeries} from "@/components/charts/data";
import {CurrencyBarChart} from "@/components/charts/currency-bar-chart";
import {currency} from "@/components/currency";
import {differenceInDays, DurationUnit} from 'date-fns'
import { Prisma } from "@prisma/client";
import {formatDateShort, getRangeMonthsToNow} from "@/components/dates";

interface ReportFiltersState {
    monthsToNow: number
    subCategories: boolean
}

const DEFAULT_QUERY: ReportFiltersState = Object.freeze({
    monthsToNow: 1,
    subCategories: false
})

function monthsToNowLabel(monthsToNow: number) {
    switch (monthsToNow) {
        case 1:
            return 'Last month'
        case 12:
            return 'Last year'
        default:
            return `Last ${monthsToNow} months`
    }
}

function getIdealPeriod(monthsToNow: number): DurationUnit {
    if (monthsToNow >= 12) {
        return 'months'
    }
    if (monthsToNow >= 3) {
        return 'weeks'
    }
    return 'days'
}

function periodLabel(period: DurationUnit) {
    switch (period) {
        case 'days':
            return 'Daily'
        case 'weeks':
            return 'Weekly'
        case 'months':
            return 'Monthly'
        default:
            throw new Error(`period not supported ${period}`)
    }
}

export default function Home() {
    const [query, setQuery] = useState<ReportFiltersState >(DEFAULT_QUERY)
    const { accounts = [], isLoading: isAccountsLoading } = useAccounts()

    const lastStatementEnd = isAccountsLoading
        ? undefined
        : accounts.reduce((agg, { statementsTo }) =>
            !statementsTo ? agg
                : !agg ? statementsTo
                    : statementsTo > agg ? statementsTo : agg, undefined as Date | undefined)

    if (!query) {
        return <Loading />
    }

    return (
        <>

            <StatementAlerts />

            <Stack mb={4}>
                <Flex alignItems="center" justifyContent="space-between">
                    <Heading>{monthsToNowLabel(query.monthsToNow)}</Heading>
                    <ReportFilters query={query} onChange={setQuery} />
                </Flex>

                {!!lastStatementEnd ?
                    <Heading
                        size="sm" mb={4}
                        fontStyle="italic"
                        color="gray.600"
                        _dark={{color: 'gray.400'}}
                    >
                        To last statement end {formatDateShort(lastStatementEnd)}
                    </Heading>
                    : <></>}
            </Stack>

            {isAccountsLoading
                ? <Loading />
                : <Report
                    query={{
                        ...getRangeMonthsToNow(query.monthsToNow, lastStatementEnd),
                        subCategories: query.subCategories
                    }}
                    period={getIdealPeriod(query.monthsToNow)}
                />
            }
        </>
    )
}

function Report({ query, period }: { query: CategorizedTransactionQuery, period: DurationUnit }) {
    const { transactions = [], isLoading, error } = useCategorizedTransactions(query)
    if (isLoading) {
        return <Loading />
    }
    if (error) {
        return <ErrorAlert error={error} />
    }

    if (transactions.length === 0) {
        return <NoData />
    }

    if (!query.dateFrom || !query.dateTo) {
        // TODO
        return <NoData />
    }

    const totalIncome = transactions
        .filter(t => t.categoryType === 'INCOME')
        .reduce((a, b) => a.plus(b.credit).plus(b.debit), new Prisma.Decimal(0))
        .toNumber()

    const outgoings = aggregateByCategory(
        transactions
            .filter(t => t.categoryType !== 'INCOME')
            .map(({ categoryType, ...transaction }) => ({
                ...transaction,
                categoryType,
                category: categoryTypeName(categoryType)
            }))
    )

    const totalBills = outgoings
        .find(x => x.label === categoryTypeName('BILL'))
        ?.value || 0
    const totalExpenses = outgoings
        .find(x => x.label === categoryTypeName('EXPENSE'))
        ?.value || 0

    const weeklyDisposableIncome = 7 * (totalIncome - totalBills) / differenceInDays(query.dateTo, query.dateFrom)
    const totalBalance = totalIncome - totalBills - totalExpenses

    return (
        <>
            <SimpleGrid columns={{ base: 2, sm: 3, xl: 6 }} gridRowGap={4} mb={4} bg="gray.300" _dark={{ bg: "gray.700" }} p={6}>
                <Stat textAlign="center">
                    <StatLabel>Income</StatLabel>
                    <StatNumber>{currency(totalIncome, 0)}</StatNumber>
                </Stat>

                <Stat textAlign="center">
                    <StatLabel>Bills</StatLabel>
                    <StatNumber>{currency(totalBills, 0)}</StatNumber>
                </Stat>

                <Stat textAlign="center">
                    <StatLabel>Expenses</StatLabel>
                    <StatNumber>{currency(totalExpenses, 0)}</StatNumber>
                </Stat>

                <Stat textAlign="center">
                    <StatLabel>Outgoing</StatLabel>
                    <StatNumber>{currency(totalExpenses + totalBills, 0)}</StatNumber>
                </Stat>

                <Stat textAlign="center">
                    <StatLabel>Balance</StatLabel>
                    <StatNumber>
                        <StatArrow type={totalBalance >= 0 ? 'increase' : 'decrease'} />
                        {currency(totalBalance, 0)}
                    </StatNumber>
                </Stat>

                <Stat textAlign="center">
                    <StatLabel>Disposable/Wk</StatLabel>
                    <StatNumber>{currency(weeklyDisposableIncome, 0)}</StatNumber>
                </Stat>
            </SimpleGrid>

            <Heading size="md" mb={4}>Cash Flow ({periodLabel(period)})</Heading>

            <CurrencyBarChart data={timeSeries(transactions, query.dateFrom, query.dateTo, period)} />

            <SimpleGrid columns={{ base: 1, xl: 2 }}>
                <Box>
                    <Heading size="md" mb={4}>Bills</Heading>
                    <CurrencyPieChart data={aggregateByCategory(transactions.filter(t => t.categoryType === 'BILL'))} />
                </Box>
                <Box>
                    <Heading size="md" mb={4}>Expenses</Heading>
                    <CurrencyPieChart data={aggregateByCategory(transactions.filter(t => t.categoryType === 'EXPENSE'))} />
                </Box>
                <Box>
                    <Heading size="md" mb={4}>Income</Heading>
                    <CurrencyPieChart data={aggregateByCategory(transactions.filter(t => t.categoryType === 'INCOME'))} />
                </Box>
                <Box>
                    <Heading size="md" mb={4}>Outgoings</Heading>
                    <CurrencyPieChart data={outgoings} />
                </Box>
            </SimpleGrid>
        </>
    )
}

function ReportFilters({ query, onChange }: { query: ReportFiltersState, onChange(query: ReportFiltersState): void }) {
    const {isOpen, onOpen, onClose} = useDisclosure()

    const filtersApplied = Object.entries(query).some(([, v]) => !!v)

    return (
        <>
            <IconButton
                icon={(
                    <Avatar bg="yellow.500" size="md" icon={<FilterIcon/>}>
                        {filtersApplied ? <AvatarBadge boxSize='1.25em' bg='green.500'></AvatarBadge> : <></>}
                    </Avatar>
                )}
                aria-label="filter"
                onClick={onOpen}
                variant="ghost"
            />
            <Drawer
                isOpen={isOpen}
                placement='right'
                onClose={onClose}
                size="sm"
            >
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    <DrawerHeader>Report Filters</DrawerHeader>
                    <DrawerBody>
                        <Stack spacing={6}>
                            <FormControl>
                                <FormLabel>Dates</FormLabel>
                                <Select
                                    defaultValue={query.monthsToNow}
                                    onChange={ev => onChange({ ...query, monthsToNow: Number(ev.target.value) })}
                                >
                                    {[1, 2, 3, 6, 12].map(m =>
                                        <option key={`months-${m}`} value={m}>{monthsToNowLabel(m)}</option>)}
                                </Select>
                            </FormControl>

                            <FormControl as={SimpleGrid} columns={2}>
                                <FormLabel htmlFor='subCategories'>Include sub categories?</FormLabel>
                                <Switch
                                    defaultChecked={query.subCategories}
                                    id='subCategories'
                                    onChange={e => onChange({ ...query, subCategories: e.target.checked })}
                                />
                            </FormControl>

                            <Button mt={4} colorScheme="teal" variant="outline" onClick={onClose}>
                                Apply
                            </Button>

                            <Button colorScheme="red" variant="outline" onClick={() => {
                                onChange(DEFAULT_QUERY)
                                onClose()
                            }}>
                                Clear
                            </Button>
                        </Stack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

        </>
    )
}
