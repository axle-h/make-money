import {
    NewCategory,
    PaginatedTransactionQuery,
    Transaction,
    TransactionCategory,
    UpdateTransactionRequest
} from "@/app/api/schema";
import {PaginatedParams, toApiQuery} from "./types";
import { Box, IconButton, Menu, Stack, Tag, Table, Wrap, WrapItem } from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import {CodeIcon, MoreVerticalIcon, CheckIcon, EditIcon, TriangleDownIcon, TriangleUpIcon} from "@/components/icons";
import {useTransactions} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {formatDateShort} from "@/components/dates";
import {Pagination} from "@/components/pagination";
import {TransactionApproveDrawer} from "../transactions/transaction-approve-drawer";
import {CreateOrUpdateCategoryDrawer} from "../categories/create-or-update-category-drawer";
import {AccountSummary} from "../accounts/account-summary";
import {TransactionName} from "../transactions/transaction-summary";
import {CashFlow} from "@/components/cash-flow";

type OrderByField = Required<PaginatedTransactionQuery>['orderBy']

interface TransactionTableProps {
    queryParams: PaginatedParams

    updatePage(page: number): void

    updateSort(orderBy: OrderByField, orderByDescending: boolean): void

    onCategoryReset(id: number): Promise<boolean>

    onBuildRule(transaction: Transaction): void

    onUpdate(id: number, values: UpdateTransactionRequest): Promise<boolean>

    onCreateCategory(category: NewCategory): Promise<boolean>
}

export function TransactionTable({queryParams, updatePage, updateSort, onCategoryReset, onBuildRule, onUpdate, onCreateCategory}: TransactionTableProps) {
    const limit = 20
    const [pageCount, updatePageCount] = useState<number | null>(null)
    const query: PaginatedTransactionQuery = {
        page: queryParams.page,
        limit,
        orderBy: queryParams.orderBy,
        orderByDescending: queryParams.orderByDescending,
        ...toApiQuery(queryParams)
    }

    const {transactions, isLoading, error} = useTransactions(query)
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
    const transactionCount = transactions?.count || null

    useEffect(() => {
        if (transactionCount) {
            updatePageCount(Math.ceil(transactionCount / limit))
        }
    }, [transactionCount, limit])

    if (isLoading) {
        return <Loading/>
    }

    if (error) {
        return <ErrorAlert error={error}/>
    }

    if (!transactions || transactions.data.length === 0) {
        return <NoData/>
    }

    const rows = transactions.data.map(transaction => {
        return (
            <Table.Row key={transaction.id}>
                <Table.Cell>{formatDateShort(transaction.date)}</Table.Cell>
                <Table.Cell whiteSpace="initial">
                    <Stack gap={1}>
                        <TransactionName transaction={transaction} />
                        <Wrap>
                            {transaction.categories.map(category =>
                                <WrapItem key={category.id}><TransactionCategoryTag category={category}/></WrapItem>
                            )}
                        </Wrap>
                    </Stack>
                </Table.Cell>
                <Table.Cell>
                    <AccountSummary {...transaction} />
                </Table.Cell>
                <Table.Cell textAlign="end">
                    <CashFlow amount={transaction.amount} />
                </Table.Cell>
                <Table.Cell mx={0}>
                    <TransactionMenu
                        transaction={transaction}
                        onCategoryReset={() => onCategoryReset(transaction.id)}
                        onBuildRule={() => onBuildRule(transaction)}
                        onUpdate={values => onUpdate(transaction.id, values)}
                        onCreateNewCategory={() => setCreateCategoryOpen(true)}
                    />
                </Table.Cell>
            </Table.Row>
        )
    })

    function SortableHeader({title, field, ...props}: Table.ColumnHeaderProps & { title: string, field: OrderByField }) {
        const sorted = queryParams.orderBy === field
            ? (queryParams.orderByDescending ? 'desc' : 'asc')
            : null
        return (
            <Table.ColumnHeader {...props} onClick={() => {
                const nextSorted = sorted === null || sorted === 'desc' ? 'asc' : 'desc'
                return updateSort(field, nextSorted === 'desc')
            }} cursor="pointer">
                {title}
                <SortChevron sorted={sorted}/>
            </Table.ColumnHeader>
        )
    }

    return (
        <>
            <Table.Root variant='line'>
                <Table.Header>
                    <Table.Row>
                        <SortableHeader title="Date" field="date"/>
                        <SortableHeader title="Name" field="name"/>
                        <SortableHeader title="Account" field="accountId"/>
                        <SortableHeader textAlign="end" title="Amount" field="amount"/>
                        <Table.ColumnHeader mx={0}></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows}
                </Table.Body>
            </Table.Root>
            {pageCount ? <Pagination current={queryParams.page} count={pageCount} onPaginate={updatePage}/> : <></>}

            <CreateOrUpdateCategoryDrawer open={createCategoryOpen} setOpen={setCreateCategoryOpen} onSubmit={onCreateCategory} />
        </>
    )
}

interface TransactionMenuProps {
    transaction: Transaction,
    onCategoryReset(): Promise<boolean>
    onBuildRule(): void
    onUpdate(values: UpdateTransactionRequest): Promise<boolean>
    onCreateNewCategory(): void
}

function TransactionMenu({transaction, onCategoryReset, onBuildRule, onUpdate, onCreateNewCategory}: TransactionMenuProps) {
    const [isCategoryReset, setCategoryReset] = useState(false)
    const [approveOpen, setApproveOpen] = useState(false)

    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <IconButton variant="ghost">
                    <MoreVerticalIcon/>
                </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
                <Menu.Content>
                    <Menu.Item value="approve" onClick={() => setApproveOpen(true)}>
                        <CheckIcon /> Approve
                    </Menu.Item>
                    <Menu.Item value="create-rule" onClick={onBuildRule}>
                        <CodeIcon/> Create rule
                    </Menu.Item>
                    <Menu.Item
                        value="reset-categories"
                        disabled={isCategoryReset}
                        onClick={async () => {
                            setCategoryReset(true)
                            try {
                                await onCategoryReset()
                            } finally {
                                setCategoryReset(false)
                            }
                        }}
                    >
                        <EditIcon/> Reset categories
                    </Menu.Item>
                </Menu.Content>
            </Menu.Positioner>

            <TransactionApproveDrawer
                open={approveOpen}
                setOpen={setApproveOpen}
                transaction={transaction}
                onSubmit={onUpdate}
                onBuildRule={onBuildRule}
                onCreateNewCategory={onCreateNewCategory}
            />
        </Menu.Root>
    )
}

function SortChevron({sorted}: { sorted: 'desc' | 'asc' | null }) {
    if (sorted === null) {
        return <></>
    }
    return (
        <Box as="span" pl="4">
            {sorted === "desc"
                ? <TriangleDownIcon aria-label="sorted descending"/>
                : <TriangleUpIcon aria-label="sorted ascending"/>}
        </Box>
    )
}

function TransactionCategoryTag({category: {name, fraction}}: { category: TransactionCategory }) {
    return (
        <Tag.Root colorPalette="purple">
            <Tag.Label>{name} {fraction === 1 ? <></> : <>{fraction * 100}%</>}</Tag.Label>
        </Tag.Root>
    )
}