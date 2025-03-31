import { Statement } from "@/app/api/schema";
import React, {useEffect, useState} from "react";
import {useStatements} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import { Dialog, IconButton, Menu, Table } from "@chakra-ui/react";
import {formatDateRange, formatDateTimeLong} from "@/components/dates";
import {Pagination} from "@/components/pagination";
import {MoreVerticalIcon, DeleteIcon, ViewIcon} from "@/components/icons";
import {AccountSummary} from "../accounts/account-summary";
import {Button} from "@/components/ui/button";

interface StatementTableProps {
    page: number

    updatePage(page: number): void

    onDelete(statement: Statement): Promise<void>

    onViewTransactions(statement: Statement): void
}

export function StatementTable({page, updatePage, onDelete, onViewTransactions}: StatementTableProps) {
    const limit = 20
    const [pageCount, updatePageCount] = useState<number | null>(null)
    const {statements, isLoading, error} = useStatements({
        page,
        limit,
        orderBy: 'dateUploaded',
        orderByDescending: true
    })

    useEffect(() => {
        if (statements?.count) {
            updatePageCount(Math.ceil(statements.count / limit))
        }
    }, [statements?.count, limit])

    if (isLoading) {
        return <Loading/>
    }

    if (error) {
        return <ErrorAlert error={error}/>
    }

    if (!statements || statements.data.length === 0) {
        return <NoData/>
    }

    const rows = statements.data.map(statement =>
        (<Table.Row key={statement.id}>
            <Table.Cell>{formatDateTimeLong(statement.dateUploaded)}</Table.Cell>
            <Table.Cell>
                {formatDateRange(statement.startDate, statement.endDate)}
            </Table.Cell>
            <Table.Cell>{statement.transactionCount}</Table.Cell>
            <Table.Cell>
                <AccountSummary {...statement} />
            </Table.Cell>
            <Table.Cell mx={0}>
                <StatementMenu statement={statement} onDelete={onDelete} onViewTransactions={onViewTransactions}/>
            </Table.Cell>
        </Table.Row>))

    return (
        <>
            <Table.Root variant='line'>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Uploaded</Table.ColumnHeader>
                        <Table.ColumnHeader>Date Range</Table.ColumnHeader>
                        <Table.ColumnHeader>Transactions</Table.ColumnHeader>
                        <Table.ColumnHeader>Account</Table.ColumnHeader>
                        <Table.ColumnHeader mx={0}></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows}
                </Table.Body>
            </Table.Root>
            {pageCount ? <Pagination current={page} count={pageCount} onPaginate={updatePage}/> : <></>}
        </>
    )
}

interface StatementMenuProps extends Pick<StatementTableProps, 'onDelete' | 'onViewTransactions'> {
    statement: Statement
}

function StatementMenu({onDelete, onViewTransactions, statement}: StatementMenuProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    async function statefulOnDelete() {
        setIsDeleting(true)
        try {
            await onDelete(statement)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <IconButton variant="ghost">
                        <MoreVerticalIcon/>
                    </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item
                            value="view-transactions"
                            onClick={() => onViewTransactions(statement)}
                        >
                            <ViewIcon/> View transactions
                        </Menu.Item>
                        <Menu.Item
                            value="delete-statement"
                            disabled={isDeleting}
                            onClick={() => {
                                if (statement.transactionCount > 0) {
                                    setDeleteOpen(true)
                                } else {
                                    return statefulOnDelete()
                                }
                            }}
                        >
                            <DeleteIcon/> Delete
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Menu.Root>

            {statement.transactionCount > 0 ? (
                <Dialog.Root
                    role="alertdialog"
                    open={deleteOpen}
                    onOpenChange={(e) => setDeleteOpen(e.open)}
                >
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header fontSize='lg' fontWeight='bold'>
                                Delete Account
                            </Dialog.Header>

                            <Dialog.Body>
                                This will delete all transactions attached to this statement.
                            </Dialog.Body>

                            <Dialog.Footer>
                                <Button disabled={isDeleting} onClick={() => setDeleteOpen(false)}>
                                    Cancel
                                </Button>
                                <Button colorPalette='red' loading={isDeleting} onClick={async () => {
                                    await statefulOnDelete()
                                    setDeleteOpen(false)
                                }} ml={3}>
                                    Delete
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>

                </Dialog.Root>
            ) : <></>}
        </>
    )
}