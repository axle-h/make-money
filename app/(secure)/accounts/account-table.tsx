import {Account} from "@/app/api/schema";
import {useAccounts} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {
    Box,
    Dialog,
    IconButton,
    Menu, Portal,
    Table,
} from "@chakra-ui/react";
import React, {useState} from "react";
import {MoreVerticalIcon, DeleteIcon, ViewIcon} from "@/components/icons";
import {AccountTypeTag} from "./account-summary";
import {formatDateShort, needsNewStatement} from "@/components/dates";
import {Button} from "@/components/ui/button";

export function AccountTable({onDelete, onViewTransactions}: {
    onDelete(account: Account): Promise<void>,
    onViewTransactions(account: Account): void
}) {
    const {accounts, isLoading, error} = useAccounts()

    if (isLoading) {
        return <Loading/>
    }

    if (error) {
        return <ErrorAlert error={error}/>
    }

    if (!accounts || accounts.length === 0) {
        return <NoData/>
    }

    const rows = accounts.map(account =>
        (<Table.Row key={account.id}>

            <Table.Cell>{account.bankName}</Table.Cell>
            <Table.Cell>{account.accountName}</Table.Cell>
            <Table.Cell>
                <AccountTypeTag accountType={account.accountType} />
            </Table.Cell>
            <Table.Cell>
                {account.statementsTo
                    ? (<Box as="span" color={needsNewStatement(account.statementsTo) ? 'red' : 'green'}>
                        {formatDateShort(account.statementsTo)}
                      </Box>)
                    : 'None'}
            </Table.Cell>
            <Table.Cell px={0}>
                <AccountMenu onDelete={onDelete} onViewTransactions={onViewTransactions} account={account}/>
            </Table.Cell>
        </Table.Row>))

    return (
        <Table.Root variant="line">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Bank</Table.ColumnHeader>
                    <Table.ColumnHeader>Account #</Table.ColumnHeader>
                    <Table.ColumnHeader>Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Statements To</Table.ColumnHeader>
                    <Table.ColumnHeader px={0}></Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {rows}
            </Table.Body>
        </Table.Root>
    )
}

function AccountMenu({onDelete, onViewTransactions, account}: {
    onDelete(account: Account): Promise<void>,
    onViewTransactions(account: Account): void,
    account: Account
}) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteOpen, setDeleteOpen] = useState(false)

    return (
        <>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <IconButton aria-label='Options' variant="ghost">
                        <MoreVerticalIcon />
                    </IconButton>
                </Menu.Trigger>

                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item value="view-transactions" onClick={() => onViewTransactions(account)}>
                                <ViewIcon/> View transactions
                            </Menu.Item>
                            <Menu.Item
                                value="delete-account"
                                disabled={isDeleting}
                                onClick={() => setDeleteOpen(true)}
                            >
                                <DeleteIcon/> Delete
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>

            <Dialog.Root
                lazyMount
                role="alertdialog"
                open={isDeleteOpen}
                onOpenChange={(e) => setDeleteOpen(e.open)}
            >
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header fontSize='lg' fontWeight='bold'>
                                Delete Account
                            </Dialog.Header>

                            <Dialog.Body>
                                This will delete all statements and transactions attached to this account.
                            </Dialog.Body>

                            <Dialog.Footer>
                                <Button disabled={isDeleting} onClick={() => setDeleteOpen(false)}>
                                    Cancel
                                </Button>
                                <Button colorPalette='red' loading={isDeleting} onClick={async () => {
                                    setIsDeleting(true)
                                    try {
                                        await onDelete(account)
                                    } finally {
                                        setIsDeleting(false)
                                        setDeleteOpen(false)
                                    }
                                }} ml={3}>
                                    Delete
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    )
}