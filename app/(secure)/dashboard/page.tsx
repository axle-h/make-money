"use client";

import {
  Box,
  Drawer,
  Flex,
  Field,
  Heading,
  IconButton,
  NativeSelect,
  SimpleGrid,
  Stack,
  Stat,
  Switch,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { FilterIcon, FiltersAppliedBadge } from "@/components/icons";
import { CategorizedTransactionQuery } from "@/app/api/schema";
import { useAccounts, useCategorizedTransactions } from "@/api-client";
import {
  ErrorAlert,
  Loading,
  NoData,
  StatementAlerts,
} from "@/components/alert";
import { CurrencyPieChart } from "@/components/charts/currency-pie-chart";
import {
  aggregateByCategory,
  keyStats,
  outgoings,
  timeSeries,
} from "@/components/charts/data";
import { CurrencyBarChart } from "@/components/charts/currency-bar-chart";
import { currency } from "@/components/currency";
import { DurationUnit } from "date-fns";
import { formatDateShort, getRangeMonthsToNow } from "@/components/dates";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface ReportFiltersState {
  monthsToNow: number;
  subCategories: boolean;
}

const DEFAULT_QUERY: ReportFiltersState = Object.freeze({
  monthsToNow: 1,
  subCategories: false,
});

function monthsToNowLabel(monthsToNow: number) {
  switch (monthsToNow) {
    case 1:
      return "Last month";
    case 12:
      return "Last year";
    default:
      return `Last ${monthsToNow} months`;
  }
}

function getIdealPeriod(monthsToNow: number): DurationUnit {
  if (monthsToNow >= 12) {
    return "months";
  }
  if (monthsToNow >= 3) {
    return "weeks";
  }
  return "days";
}

function periodLabel(period: DurationUnit) {
  switch (period) {
    case "days":
      return "Daily";
    case "weeks":
      return "Weekly";
    case "months":
      return "Monthly";
    default:
      throw new Error(`period not supported ${period}`);
  }
}

export default function Home() {
  const [query, setQuery] = useState<ReportFiltersState>(DEFAULT_QUERY);
  const { accounts = [], isLoading: isAccountsLoading } = useAccounts();

  const lastStatementEnd = isAccountsLoading
    ? undefined
    : accounts.reduce(
        (agg, { statementsTo }) =>
          !statementsTo
            ? agg
            : !agg
              ? statementsTo
              : statementsTo > agg
                ? statementsTo
                : agg,
        undefined as Date | undefined,
      );

  if (!query) {
    return <Loading />;
  }

  return (
    <>
      <StatementAlerts />

      <Stack mb={4}>
        <Flex alignItems="center" justifyContent="space-between">
          <Heading>{monthsToNowLabel(query.monthsToNow)}</Heading>
          <ReportFilters query={query} onChange={setQuery} />
        </Flex>

        {!!lastStatementEnd ? (
          <Heading
            size="sm"
            mb={4}
            fontStyle="italic"
            color="gray.600"
            _dark={{ color: "gray.400" }}
          >
            To last statement end {formatDateShort(lastStatementEnd)}
          </Heading>
        ) : (
          <></>
        )}
      </Stack>

      {isAccountsLoading ? (
        <Loading />
      ) : (
        <Report
          query={{
            ...getRangeMonthsToNow(query.monthsToNow, lastStatementEnd),
            subCategories: query.subCategories,
          }}
          period={getIdealPeriod(query.monthsToNow)}
        />
      )}
    </>
  );
}

function Report({
  query,
  period,
}: {
  query: CategorizedTransactionQuery;
  period: DurationUnit;
}) {
  const {
    transactions = [],
    isLoading,
    error,
  } = useCategorizedTransactions(query);
  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (!query.dateFrom || !query.dateTo) {
    // TODO
    return <NoData />;
  }

  const stats = keyStats(transactions);
  if (!stats) {
    return <NoData />;
  }

  return (
    <>
      <SimpleGrid
        columns={{ base: 2, sm: 3, xl: 6 }}
        gridRowGap={4}
        mb={4}
        bg="gray.300"
        _dark={{ bg: "gray.700" }}
        p={6}
      >
        <Stat.Root textAlign="center">
          <Stat.Label>Income</Stat.Label>
          <Stat.ValueText>{currency(stats.totalIncome, 0)}</Stat.ValueText>
        </Stat.Root>

        <Stat.Root textAlign="center">
          <Stat.Label>Bills</Stat.Label>
          <Stat.ValueText>{currency(stats.totalBills, 0)}</Stat.ValueText>
        </Stat.Root>

        <Stat.Root textAlign="center">
          <Stat.Label>Expenses</Stat.Label>
          <Stat.ValueText>{currency(stats.totalExpenses, 0)}</Stat.ValueText>
        </Stat.Root>

        <Stat.Root textAlign="center">
          <Stat.Label>Outgoing</Stat.Label>
          <Stat.ValueText>{currency(stats.totalOutgoings, 0)}</Stat.ValueText>
        </Stat.Root>

        <Stat.Root textAlign="center">
          <Stat.Label>Balance</Stat.Label>
          <Stat.ValueText>{currency(stats.totalBalance, 0)}</Stat.ValueText>
        </Stat.Root>

        <Stat.Root textAlign="center">
          <Stat.Label>Disposable/Wk</Stat.Label>
          <Stat.ValueText>
            {currency(stats.weeklyDisposableIncome, 0)}
          </Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>

      <Heading size="md" mb={4}>
        Cash Flow ({periodLabel(period)})
      </Heading>

      <CurrencyBarChart
        data={timeSeries(transactions, query.dateFrom, query.dateTo, period)}
      />

      <SimpleGrid columns={{ base: 1, xl: 2 }}>
        <Box>
          <Heading size="md" mb={4}>
            Bills
          </Heading>
          <CurrencyPieChart
            data={aggregateByCategory(
              transactions.filter((t) => t.categoryType === "BILL"),
            )}
          />
        </Box>
        <Box>
          <Heading size="md" mb={4}>
            Expenses
          </Heading>
          <CurrencyPieChart
            data={aggregateByCategory(
              transactions.filter((t) => t.categoryType === "EXPENSE"),
            )}
          />
        </Box>
        <Box>
          <Heading size="md" mb={4}>
            Income
          </Heading>
          <CurrencyPieChart
            data={aggregateByCategory(
              transactions.filter((t) => t.categoryType === "INCOME"),
            )}
          />
        </Box>
        <Box>
          <Heading size="md" mb={4}>
            Outgoings
          </Heading>
          <CurrencyPieChart data={outgoings(transactions)} />
        </Box>
      </SimpleGrid>
    </>
  );
}

function ReportFilters({
  query,
  onChange,
}: {
  query: ReportFiltersState;
  onChange(query: ReportFiltersState): void;
}) {
  const [open, setOpen] = useState(false);

  const filtersApplied = Object.entries(query).some(([, v]) => !!v);

  return (
    <>
      <IconButton
        aria-label="filter"
        onClick={() => setOpen(true)}
        variant="ghost"
      >
        <Avatar bg="yellow.500" size="md" icon={<FilterIcon />}>
          {filtersApplied ? <FiltersAppliedBadge /> : <></>}
        </Avatar>
      </IconButton>
      <Drawer.Root
        open={open}
        placement="end"
        onOpenChange={(e) => setOpen(e.open)}
        size="sm"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Header>Report Filters</Drawer.Header>
            <Drawer.Body>
              <Stack gap={6}>
                <Field.Root>
                  <Field.Label>Dates</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={query.monthsToNow}
                      onChange={(ev) =>
                        onChange({
                          ...query,
                          monthsToNow: Number(ev.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 6, 12].map((m) => (
                        <option key={`months-${m}`} value={m}>
                          {monthsToNowLabel(m)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Switch.Root
                  checked={query.subCategories}
                  onCheckedChange={(e) =>
                    onChange({ ...query, subCategories: e.checked })
                  }
                >
                  <Switch.HiddenInput />
                  <Switch.Label>Include sub categories?</Switch.Label>
                  <Switch.Control />
                </Switch.Root>

                <Button
                  mt={4}
                  colorPalette="teal"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Apply
                </Button>

                <Button
                  colorPalette="red"
                  variant="outline"
                  onClick={() => {
                    onChange(DEFAULT_QUERY);
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}
