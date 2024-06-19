import {Account} from "@/app/api/schema";
import {useAccounts} from "@/api-client";
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
    MenuList,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useDisclosure
} from "@chakra-ui/react";
import React, {useState} from "react";
import {MoreVerticalIcon} from "@/components/icons";
import {DeleteIcon, ViewIcon} from "@chakra-ui/icons";
import {AccountTypeTag} from "./account-summary";
import {formatDateShort, needsNewStatement} from "@/components/dates";

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
        (<Tr key={account.id}>

            <Td>{account.bankName}</Td>
            <Td>{account.accountName}</Td>
            <Td>
                <AccountTypeTag accountType={account.accountType} />
            </Td>
            <Td>
                {account.statementsTo
                    ? (<Box as="span" color={needsNewStatement(account.statementsTo) ? 'red' : 'green'}>
                        {formatDateShort(account.statementsTo)}
                      </Box>)
                    : 'None'}
            </Td>
            <Td px={0}>
                <AccountMenu onDelete={onDelete} onViewTransactions={onViewTransactions} account={account}/>
            </Td>
        </Tr>))

    return (
        <TableContainer>
            <Table variant='simple'>
                <Thead>
                    <Tr>
                        <Th>Bank</Th>
                        <Th>Account #</Th>
                        <Th>Type</Th>
                        <Th>Statements To</Th>
                        <Th px={0}></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {rows}
                </Tbody>
            </Table>
        </TableContainer>
    )
}

function AccountMenu({onDelete, onViewTransactions, account}: {
    onDelete(account: Account): Promise<void>,
    onViewTransactions(account: Account): void,
    account: Account
}) {
    const [isDeleting, setIsDeleting] = useState(false)
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure()
    const cancelDeleteRef = React.useRef()

    return (
        <>
            <Menu isLazy>
                <MenuButton as={IconButton} aria-label='Options' icon={<MoreVerticalIcon/>} variant="ghost"/>
                <MenuList>
                    <MenuItem
                        icon={<ViewIcon/>}
                        onClick={() => onViewTransactions(account)}
                    >
                        View transactions
                    </MenuItem>
                    <MenuItem
                        icon={<DeleteIcon/>}
                        isDisabled={isDeleting}
                        onClick={onDeleteOpen}
                    >
                        Delete
                    </MenuItem>
                </MenuList>
            </Menu>

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
                            This will delete all statements and transactions attached to this account.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelDeleteRef as any} isDisabled={isDeleting} onClick={onDeleteClose}>
                                Cancel
                            </Button>
                            <Button colorScheme='red' isLoading={isDeleting} onClick={async () => {
                                setIsDeleting(true)
                                try {
                                    await onDelete(account)
                                } finally {
                                    setIsDeleting(false)
                                    onDeleteClose()
                                }
                            }} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    )
}