'use client'

import {Button, ButtonGroup, Flex, Heading, Tag, useToast} from "@chakra-ui/react";
import {useRouter} from "next/navigation";
import React, {useState} from "react";
import {PaginatedParams, QueryParams} from "./types";
import {TransactionTable} from "./transaction-table";
import {TransactionFilters} from "./transaction-filters";
import {
    approveAllTransactionsForRule,
    approveTransaction,
    buildRuleUrl,
    resetTransactionCategories
} from "./actions";
import {createCategory} from "../categories/actions";
import {CheckIcon} from "@chakra-ui/icons";

interface TransactionsPageProps  {
    searchParams: { [P in keyof PaginatedParams]: string } & { bulkApproveName: string }
}

export default function TransactionsPage({ searchParams }: TransactionsPageProps) {
    const toast = useToast({ position: 'top' })
    const router = useRouter()
    const [isBulkApproval, setBulkApproval] = useState(false)

    const queryParams: QueryParams = {
        accountId: Number(searchParams?.accountId) || undefined,
        statementId: Number(searchParams?.statementId) || undefined,
        categoryId: Number(searchParams?.categoryId) || undefined,
        ruleId: Number(searchParams?.ruleId) || undefined,
        type: searchParams.type,
        name: searchParams.name,
        description: searchParams.description,
        uncategorized: searchParams?.uncategorized === 'true' || searchParams?.uncategorized === '1',
    }
    const paginatedParams: PaginatedParams = {
        ...queryParams,
        page: Number(searchParams?.page) || 1,
        orderBy: searchParams.orderBy as any,
        orderByDescending: searchParams.orderByDescending === 'true',
    }

    if (!paginatedParams.orderBy) {
        paginatedParams.orderBy = 'date'
        paginatedParams.orderByDescending = true
    }

    function updateQuery(nextParams: QueryParams) {
        const urlParams = new URLSearchParams()
        for (let [key, value] of Object.entries(nextParams)) {
            if (value) {
                urlParams.set(key, value.toString())
            }
        }
        urlParams.set('page', '1')
        router.replace('?' + urlParams.toString())
    }

    return (
        <>
            <Heading>Transactions</Heading>
            {!!searchParams.bulkApproveName ? <Heading size="sm">Approving {searchParams.bulkApproveName}</Heading> : <></>}
            <Flex alignItems="center" justifyContent="space-between" mb={4} mt={6}>
                <ButtonGroup variant="outline">
                    {!!searchParams.bulkApproveName && !!queryParams.ruleId && queryParams.uncategorized === true ? (
                        <>
                            <Button
                                colorScheme="yellow"
                                leftIcon={<CheckIcon/>}
                                isLoading={isBulkApproval}
                                onClick={async () => {
                                    setBulkApproval(true)
                                    if (await approveAllTransactionsForRule(toast, queryParams.ruleId || 0)) {
                                        router.push('rules')
                                    }
                                    setBulkApproval(false)
                                }}
                            >
                                Approve All
                            </Button>
                        </>
                    ) : <></>}
                </ButtonGroup>
                <TransactionFilters queryParams={queryParams} onChange={updateQuery} />
            </Flex>
            <TransactionTable
                queryParams={paginatedParams}
                updateSort={(orderBy, orderByDescending) => {
                    const urlParams = new URLSearchParams(searchParams)
                    urlParams.set('orderBy', orderBy)
                    urlParams.set('orderByDescending', orderByDescending.toString())
                    router.replace('?' + urlParams.toString())
                }}
                updatePage={page => {
                    const urlParams = new URLSearchParams(searchParams)
                    urlParams.set('page', page.toString())
                    router.replace('?' + urlParams.toString())
                }}
                onCategoryReset={id => resetTransactionCategories(toast, id)}
                onBuildRule={transaction => router.push(buildRuleUrl(transaction))}
                onUpdate={(id, values) => approveTransaction(toast, id, values)}
                onCreateCategory={category => createCategory(toast, category)}
            />
        </>
    )
}

