import {accountTypeName, Statement} from "@/app/api/schema";
import React, {useEffect, useState} from "react";
import {useStatements} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay, Box,
    Button,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList, Stack,
    Table,
    TableContainer, Tag,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useDisclosure
} from "@chakra-ui/react";
import {formatDateLong, formatDateRange, formatDateTimeLong} from "@/components/dates";
import {Pagination} from "@/components/pagination";
import {MoreVerticalIcon} from "@/components/icons";
import {DeleteIcon, ViewIcon} from "@chakra-ui/icons";
import {AccountSummary} from "../accounts/account-summary";

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
        (<Tr key={statement.id}>
            <Td>{formatDateTimeLong(statement.dateUploaded)}</Td>
            <Td>
                {formatDateRange(statement.startDate, statement.endDate)}
            </Td>
            <Td>{statement.transactionCount}</Td>
            <Td>
                <AccountSummary {...statement} />
            </Td>
            <Td mx={0}>
                <StatementMenu statement={statement} onDelete={onDelete} onViewTransactions={onViewTransactions}/>
            </Td>
        </Tr>))

    return (
        <>
            <TableContainer>
                <Table variant='simple'>
                    <Thead>
                        <Tr>
                            <Th>Uploaded</Th>
                            <Th>Date Range</Th>
                            <Th>Transactions</Th>
                            <Th>Account</Th>
                            <Th mx={0}></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {rows}
                    </Tbody>
                </Table>
            </TableContainer>
            {pageCount ? <Pagination current={page} count={pageCount} onPaginate={updatePage}/> : <></>}
        </>
    )
}

interface StatementMenuProps extends Pick<StatementTableProps, 'onDelete' | 'onViewTransactions'> {
    statement: Statement
}

function StatementMenu({onDelete, onViewTransactions, statement}: StatementMenuProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure()
    const cancelDeleteRef = React.useRef()

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
            <Menu isLazy>
                <MenuButton as={IconButton} aria-label='Options' icon={<MoreVerticalIcon/>} variant="ghost"/>
                <MenuList>
                    <MenuItem
                        icon={<ViewIcon/>}
                        onClick={() => onViewTransactions(statement)}
                    >
                        View transactions
                    </MenuItem>
                    <MenuItem
                        icon={<DeleteIcon/>}
                        isDisabled={isDeleting}
                        onClick={() => {
                            if (statement.transactionCount > 0) {
                                onDeleteOpen()
                            } else {
                                return statefulOnDelete()
                            }
                        }}
                    >
                        Delete
                    </MenuItem>
                </MenuList>
            </Menu>

            {statement.transactionCount > 0 ? (
                <AlertDialog
                    isOpen={isDeleteOpen}
                    leastDestructiveRef={cancelDeleteRef as any}
                    onClose={onDeleteClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                                Delete Account
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                This will delete all transactions attached to this statement.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelDeleteRef as any} isDisabled={isDeleting} onClick={onDeleteClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme='red' isLoading={isDeleting} onClick={async () => {
                                    await statefulOnDelete()
                                    onDeleteClose()
                                }} ml={3}>
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            ) : <></>}

        </>
    )
}