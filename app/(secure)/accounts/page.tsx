'use client'

import {
    Button,
    ButtonGroup,
    CreateToastFnReturn,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Heading,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import {ApiError} from "@/api-client/error";
import {AddIcon} from "@chakra-ui/icons";
import React from "react";
import {FocusableElement} from "@chakra-ui/utils";
import {Account, NewAccount} from "@/app/api/schema";
import {accountApi, mutateAccounts} from "@/api-client";
import {mutateAll} from "@/api-client/request";
import {AccountTable} from "./account-table";
import {NewAccountForm} from "./new-account-form";
import {useRouter} from "next/navigation";

export default function AccountsPage() {
    const toast = useToast({ position: 'top' })
    const router = useRouter()
    return (<>
        <Heading mb={6}>Accounts</Heading>
        <AccountControls
            onCreate={account => createAccount(toast, account)}
        />
        <AccountTable
            onViewTransactions={account => router.push(`transactions?accountId=${account.id}`)}
            onDelete={account => deleteAccount(toast, account)}
        />
    </>)
}

function AccountControls({ onCreate }: { onCreate(account: NewAccount): Promise<boolean> }) {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const firstField = React.useRef<FocusableElement>(null)

    return (
        <>
            <ButtonGroup variant='outline' mb={4}>
                <Button colorScheme='teal' leftIcon={<AddIcon />} onClick={onOpen}>New Account</Button>
            </ButtonGroup>
            <Drawer
                isOpen={isOpen}
                placement='right'
                initialFocusRef={firstField}
                onClose={onClose}
                size="md"
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />

                    <DrawerHeader>
                        Create a new account
                    </DrawerHeader>

                    <DrawerBody>
                        <NewAccountForm ref={firstField} onSubmit={async account => {
                            const result = await onCreate(account)
                            if (result) {
                                onClose()
                            }
                            return result
                        }} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}

async function createAccount(toast: CreateToastFnReturn, newAccount: NewAccount) {
    try {
        await accountApi.create(newAccount)
        await mutateAccounts()
        toast({
            title: 'Success',
            description: "Created new account.",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof ApiError && e.status === 400 && e.body.includes('P2002')) {
            description = 'account already exists'
        } else if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to create new account',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

async function deleteAccount(toast: CreateToastFnReturn, account: Account) {
    try {
        await accountApi.delete(account.id)
        await mutateAll()
        toast({
            title: 'Success',
            description: `Deleted account ${account.bankName} ${account.sortCode} ${account.accountNumber}.`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
    } catch(e) {
        let description: string
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to delete account',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }
}