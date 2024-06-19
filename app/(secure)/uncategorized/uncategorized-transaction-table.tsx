import {Account, accountTypeName, NewCategory, Transaction, UpdateTransactionRequest} from "@/app/api/schema";
import {CategoryRulePredicate, useAccounts, useRulePredicates, useTransactions} from "@/api-client";
import {ErrorAlert, Loading, NoData, UpToDate} from "@/components/alert";
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Badge,
    Box, Flex,
    Heading, Stack,
    useDisclosure
} from "@chakra-ui/react";
import {TransactionApproveForm} from "../transactions/transaction-approve-form";
import React from "react";
import {TransactionSummary} from "../transactions/transaction-summary";
import {CreateOrUpdateCategoryDrawer} from "../categories/create-or-update-category-drawer";

export interface UncategorizedTransactionTableGroupProps {
    onApprove(id: number, values: UpdateTransactionRequest): Promise<boolean>,
    onBuildRule(transaction: Transaction): void
    onCreateCategory(category: NewCategory): Promise<boolean>
}

export function UncategorizedTransactionTableGroup({ onCreateCategory, ...props }: UncategorizedTransactionTableGroupProps) {
    const { accounts = [], isLoading: loadingAccounts, error: accountError } = useAccounts()
    const { rules = [], isLoading: loadingRules, error: ruleError } = useRulePredicates()
    const createCategoryDisclosure = useDisclosure()

    if (loadingAccounts || loadingRules) {
        return <Loading/>
    }

    if (accountError) {
        return <ErrorAlert error={accountError}/>
    }

    if (ruleError) {
        return <ErrorAlert error={ruleError}/>
    }

    if (accounts.length === 0) {
        return <NoData />
    }

    return (
        <>
            <Accordion allowToggle>
                {accounts.map(account => (
                    <UncategorizedTransactionAccountSection
                        key={`account-${account.id}`}
                        {...props}
                        rules={rules}
                        account={account}
                        onCreateCategory={createCategoryDisclosure.onOpen}
                    />
                ))}
            </Accordion>
            <CreateOrUpdateCategoryDrawer {...createCategoryDisclosure} onSubmit={onCreateCategory} />
        </>
    )
}

interface UncategorizedTransactionTableProps {
    account: Account
    rules: CategoryRulePredicate[]
    onApprove(id: number, values: UpdateTransactionRequest): Promise<boolean>,
    onBuildRule(transaction: Transaction): void
    onCreateCategory(): void
}

function UncategorizedTransactionAccountSection({account, ...props}: UncategorizedTransactionTableProps) {
    const {transactions = { data: [], count: 0 }, isLoading, error} = useTransactions({
        page: 1,
        limit: 10,
        uncategorized: true,
        accountId: account.id,
        orderBy: 'date',
        orderByDescending: true
    })

    return (
        <AccordionItem key={`account-${account.id}`}>
            <AccordionButton>
                <Flex as="span" flex={1}>
                    <Flex as="span" flexDirection="column" textAlign="left">
                        <Box as="span">
                            {account.bankName} {account.accountName}
                        </Box>
                        <Box as="span"
                             fontStyle="italic"
                             color="gray.600"
                             _dark={{color: 'gray.400'}}
                             fontSize={14}
                        >
                            {accountTypeName(account.accountType)}
                        </Box>
                    </Flex>
                </Flex>

                {transactions.count > 0 ? <Badge ml={2} colorScheme="red" variant="solid">{transactions.count}</Badge> : <></>}
            </AccordionButton>
            <AccordionPanel pb={4}>
                {isLoading
                    ? <Loading />
                    : error
                        ? <ErrorAlert error={error}/>
                        : <UncategorizedTransactionTable {...props} account={account} transactions={transactions.data} />}
            </AccordionPanel>
        </AccordionItem>
    )
}

function UncategorizedTransactionTable({account, rules, onApprove, onBuildRule, onCreateCategory, transactions}: UncategorizedTransactionTableProps & { transactions: Transaction[] }) {
    if (transactions.length === 0) {
        return <UpToDate/>
    }

    const items = transactions.map(transaction => {
        const {id, date, type, name, description, amount} = transaction
        const ruleMatch= rules.find(rule => rule.predicate.evaluate(transaction))
        return (
            <AccordionItem key={id} py={3}>
                <AccordionButton>
                    <TransactionSummary transaction={transaction} ruleMatch={ruleMatch} />
                </AccordionButton>
                <AccordionPanel pb={4}>
                    <TransactionApproveForm
                        onSubmit={values => onApprove(id, values)}
                        transaction={transaction}
                        ruleMatch={ruleMatch}
                        onBuildRule={() => onBuildRule(transaction)}
                        onCreateNewCategory={onCreateCategory}
                    />
                </AccordionPanel>
            </AccordionItem>
        );
    })

    return (
        <Accordion allowToggle mb={6}>
            {items}
        </Accordion>
    )
}

