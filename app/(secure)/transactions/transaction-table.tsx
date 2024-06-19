import {
    NewCategory,
    PaginatedTransactionQuery,
    Transaction,
    TransactionCategory,
    UpdateTransactionRequest
} from "@/app/api/schema";
import {PaginatedParams, toApiQuery} from "./types";
import {
    Box,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList, Stack,
    Table,
    TableColumnHeaderProps,
    TableContainer,
    Tag,
    Tbody,
    Td,
    Th,
    Thead,
    Tr, useDisclosure, Wrap, WrapItem
} from "@chakra-ui/react";
import {CheckIcon, EditIcon, TriangleDownIcon, TriangleUpIcon} from "@chakra-ui/icons";
import React, {useEffect, useState} from "react";
import {CodeIcon, MoreVerticalIcon} from "@/components/icons";
import {useTransactions} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {formatDateShort} from "@/components/dates";
import {Pagination} from "@/components/pagination";
import {TransactionApproveDrawer} from "../transactions/transaction-approve-drawer";
import {CreateOrUpdateCategoryDrawer} from "../categories/create-or-update-category-drawer";
import {AccountSummary} from "../accounts/account-summary";
import {CashFlow, TransactionName} from "../transactions/transaction-summary";

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
    const createCategoryDisclosure = useDisclosure()
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
        return (<Tr key={transaction.id}>
            <Td>{formatDateShort(transaction.date)}</Td>
            <Td whiteSpace="initial">
                <Stack spacing={1}>
                    <TransactionName transaction={transaction} />
                    <Wrap>
                        {transaction.categories.map(category =>
                            <WrapItem key={category.id}><TransactionCategoryTag category={category}/></WrapItem>
                        )}
                    </Wrap>
                </Stack>
            </Td>
            <Td>
                <AccountSummary {...transaction} />
            </Td>
            <Td isNumeric={true}>
                <CashFlow amount={transaction.amount} />
            </Td>
            <Td mx={0}>
                <TransactionMenu
                    transaction={transaction}
                    onCategoryReset={() => onCategoryReset(transaction.id)}
                    onBuildRule={() => onBuildRule(transaction)}
                    onUpdate={values => onUpdate(transaction.id, values)}
                    onCreateNewCategory={createCategoryDisclosure.onOpen}
                />
            </Td>
        </Tr>);
    })

    function SortableHeader({title, field, ...props}: TableColumnHeaderProps & { title: string, field: OrderByField }) {
        const sorted = queryParams.orderBy === field
            ? (queryParams.orderByDescending ? 'desc' : 'asc')
            : null
        return (
            <Th {...props} onClick={() => {
                const nextSorted = sorted === null || sorted === 'desc' ? 'asc' : 'desc'
                return updateSort(field, nextSorted === 'desc')
            }} cursor="pointer">
                {title}
                <SortChevron sorted={sorted}/>
            </Th>
        )
    }

    return (
        <>
            <TableContainer>
                <Table variant='simple'>
                    <Thead>
                        <Tr>
                            <SortableHeader title="Date" field="date"/>
                            <SortableHeader title="Name" field="name"/>
                            <SortableHeader title="Account" field="accountId"/>
                            <SortableHeader isNumeric={true} title="Amount" field="amount"/>
                            <Th mx={0}></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {rows}
                    </Tbody>
                </Table>
            </TableContainer>
            {pageCount ? <Pagination current={queryParams.page} count={pageCount} onPaginate={updatePage}/> : <></>}

            <CreateOrUpdateCategoryDrawer {...createCategoryDisclosure} onSubmit={onCreateCategory} />
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
    const approveDisclosure = useDisclosure()

    return (
        <Menu isLazy>
            <MenuButton as={IconButton} icon={<MoreVerticalIcon/>} aria-label="Options" variant="ghost"/>
            <MenuList>
                <MenuItem icon={<CheckIcon />} onClick={approveDisclosure.onOpen}>
                    Approve
                </MenuItem>
                <MenuItem icon={<CodeIcon/>} onClick={onBuildRule}>
                    Create rule
                </MenuItem>
                <MenuItem
                    icon={<EditIcon/>}
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
                    Reset categories
                </MenuItem>
            </MenuList>
            <TransactionApproveDrawer
                {...approveDisclosure}
                transaction={transaction}
                onSubmit={onUpdate}
                onBuildRule={onBuildRule}
                onCreateNewCategory={onCreateNewCategory}
            />
        </Menu>
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
    return <Tag colorScheme="purple">{name} {fraction === 1 ? <></> : <>{fraction * 100}%</>}</Tag>
}