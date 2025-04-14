import {
  Account,
  accountTypeName,
  NewCategory,
  Transaction,
  UpdateTransactionRequest,
} from '@/app/api/schema'
import {
  CategoryRulePredicate,
  useAccounts,
  useRulePredicates,
  useTransactions,
} from '@/api-client'
import { ErrorAlert, Loading, NoData, UpToDate } from '@/components/alert'
import { Accordion, Badge, Box, Flex } from '@chakra-ui/react'
import { TransactionApproveForm } from '../transactions/transaction-approve-form'
import React, { useState } from 'react'
import { TransactionSummary } from '../transactions/transaction-summary'
import { CreateOrUpdateCategoryDrawer } from '../categories/create-or-update-category-drawer'

export interface UncategorizedTransactionTableGroupProps {
  onApprove(id: number, values: UpdateTransactionRequest): Promise<boolean>
  onBuildRule(transaction: Transaction): void
  onCreateCategory(category: NewCategory): Promise<boolean>
}

export function UncategorizedTransactionTableGroup({
  onCreateCategory,
  ...props
}: UncategorizedTransactionTableGroupProps) {
  const {
    accounts = [],
    isLoading: loadingAccounts,
    error: accountError,
  } = useAccounts()
  const {
    rules = [],
    isLoading: loadingRules,
    error: ruleError,
  } = useRulePredicates()
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)

  if (loadingAccounts || loadingRules) {
    return <Loading />
  }

  if (accountError) {
    return <ErrorAlert error={accountError} />
  }

  if (ruleError) {
    return <ErrorAlert error={ruleError} />
  }

  if (accounts.length === 0) {
    return <NoData />
  }

  return (
    <>
      <Accordion.Root collapsible lazyMount>
        {accounts.map((account) => (
          <UncategorizedTransactionAccountSection
            key={`account-${account.id}`}
            {...props}
            rules={rules}
            account={account}
            onCreateCategory={() => setCreateCategoryOpen(true)}
          />
        ))}
      </Accordion.Root>
      <CreateOrUpdateCategoryDrawer
        open={createCategoryOpen}
        setOpen={setCreateCategoryOpen}
        onSubmit={onCreateCategory}
      />
    </>
  )
}

interface UncategorizedTransactionTableProps {
  account: Account
  rules: CategoryRulePredicate[]
  onApprove(id: number, values: UpdateTransactionRequest): Promise<boolean>
  onBuildRule(transaction: Transaction): void
  onCreateCategory(): void
}

function UncategorizedTransactionAccountSection({
  account,
  ...props
}: UncategorizedTransactionTableProps) {
  const {
    transactions = { data: [], count: 0 },
    isLoading,
    error,
  } = useTransactions({
    page: 1,
    limit: 10,
    uncategorized: true,
    accountId: account.id,
    orderBy: 'date',
    orderByDescending: true,
  })

  return (
    <Accordion.Item
      value={`account-${account.id}`}
      key={`account-${account.id}`}
    >
      <Accordion.ItemTrigger>
        <Flex as="span" flex={1} cursor="pointer">
          <Flex as="span" flexDirection="column" textAlign="left">
            <Box as="span">
              {account.bankName} {account.accountName}
            </Box>
            <Box
              as="span"
              fontStyle="italic"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              fontSize={14}
            >
              {accountTypeName(account.accountType)}
            </Box>
          </Flex>
        </Flex>

        {transactions.count > 0 ? (
          <Badge ml={2} colorPalette="red" variant="solid">
            {transactions.count}
          </Badge>
        ) : (
          <></>
        )}
      </Accordion.ItemTrigger>
      <Accordion.ItemContent pb={4}>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : (
          <UncategorizedTransactionTable
            {...props}
            account={account}
            transactions={transactions.data}
          />
        )}
      </Accordion.ItemContent>
    </Accordion.Item>
  )
}

function UncategorizedTransactionTable({
  rules,
  onApprove,
  onBuildRule,
  onCreateCategory,
  transactions,
}: UncategorizedTransactionTableProps & { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <UpToDate />
  }

  const items = transactions.map((transaction) => {
    const { id, date, type, name, description, amount } = transaction
    const ruleMatch = rules.find((rule) => rule.predicate.evaluate(transaction))
    return (
      <Accordion.Item value={id.toString()} key={id} py={3}>
        <Accordion.ItemTrigger>
          <TransactionSummary
            cursor="pointer"
            transaction={transaction}
            ruleMatch={ruleMatch}
          />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent pb={4}>
          <TransactionApproveForm
            onSubmit={(values) => onApprove(id, values)}
            transaction={transaction}
            ruleMatch={ruleMatch}
            onBuildRule={() => onBuildRule(transaction)}
            onCreateNewCategory={onCreateCategory}
          />
        </Accordion.ItemContent>
      </Accordion.Item>
    )
  })

  return (
    <Accordion.Root collapsible mb={6}>
      {items}
    </Accordion.Root>
  )
}
