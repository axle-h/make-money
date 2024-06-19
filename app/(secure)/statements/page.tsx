'use client'

import {
    Button,
    ButtonGroup,
    CreateToastFnReturn, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader,
    DrawerOverlay, FormControl, FormLabel,
    Heading, Select, Stack, Table, TableContainer, Tbody, Td, Tr,
    useToast
} from "@chakra-ui/react";
import {FileUpload} from "@/components/file-upload";
import {ParsedStatement, parseStatementFile} from "./parse";
import React, {useState} from "react";
import {mutateStatements, statementApi, useAccounts} from "@/api-client";
import {formatDateLong, formatDateTimeLong} from "@/components/dates";
import {UploadIcon} from "@/components/icons";
import {ApiError} from "@/api-client/error";
import {accountTypeName, NewStatement, Statement} from "@/app/api/schema";
import {useRouter} from "next/navigation";
import {StatementTable} from "./statement-table";
import {FocusableElement} from "@chakra-ui/utils";
import {ErrorAlert, Loading} from "@/components/alert";
import {currency} from "@/components/currency";
import {Prisma} from "@prisma/client";
import {Field, Form, Formik} from "formik";
import {FieldProps} from "formik/dist/Field";

export default function StatementsPage({ searchParams }: { searchParams: { page?: string } }) {
    const toast = useToast({ position: 'top' })
    const router = useRouter()

    return (
        <>
            <Heading mb={6}>Statements</Heading>
            <StatementControls />
            <StatementTable
                page={Number(searchParams?.page) || 1}
                onViewTransactions={statement => router.push(`transactions?statementId=${statement.id}`)}
                onDelete={statement => deleteStatement(toast, statement)}
                updatePage={page => {
                    const params = new URLSearchParams(searchParams)
                    params.set('page', page.toString())
                    router.replace(`?` + params.toString())
                }}
            />
        </>
    )
}

function StatementControls() {
    const toast = useToast({ position: 'top' })
    const firstField = React.useRef<FocusableElement>(null)
    const [parsedStatement, setParsedStatement] = useState<ParsedStatement | null>(null)

    return (
        <>
            <ButtonGroup variant='outline' mb={4}>
                <FileUpload
                    onUpload={async file => {
                        const statement = await tryParseStatement(toast, file)
                        if (statement) {
                            setParsedStatement(statement)
                        }
                    }}
                    leftIcon={<UploadIcon />}
                    colorScheme='teal'
                >
                    Upload Statement
                </FileUpload>
            </ButtonGroup>
            <Drawer
                isOpen={!!parsedStatement}
                placement='right'
                initialFocusRef={firstField}
                onClose={() => setParsedStatement(null)}
                size="md"
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />

                    <DrawerHeader>
                        Upload a statement
                    </DrawerHeader>

                    <DrawerBody>
                        {parsedStatement ? (
                            <UploadStatementForm
                                statement={parsedStatement}
                                onSubmit={async accountId => {
                                    const result = await uploadStatement(toast, {
                                        startDate: parsedStatement.startDate,
                                        endDate: parsedStatement.endDate,
                                        accountId,
                                        transactions: parsedStatement.transactions,
                                        dateUploaded: parsedStatement.dateUploaded
                                    })
                                    if (result) {
                                        setParsedStatement(null)
                                    }
                                    return result
                                }}
                            />
                        ) : <></>}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}

function ParsedStatementSummary({ statement: { startDate, endDate, sortCode, accountNumber, transactions } }: { statement: ParsedStatement }) {
    const amounts = transactions.map(({ amount }) => new Prisma.Decimal(amount))

    const totalDebits = amounts
        .filter(t => t.isNeg())
        .reduce((a, b) => a.add(b), new Prisma.Decimal(0))
    const totalCredits = amounts
        .filter(t => t.isPos())
        .reduce((a, b) => a.add(b), new Prisma.Decimal(0))

    return (
        <TableContainer>
            <Table size="sm">
                <Tbody>
                    <Tr>
                        <Td fontWeight="bold">Start date</Td>
                        <Td>{formatDateLong(startDate)}</Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">End date</Td>
                        <Td>{formatDateLong(endDate)}</Td>
                    </Tr>
                    {!!sortCode ? (
                        <Tr>
                            <Td fontWeight="bold">Sort code</Td>
                            <Td>{sortCode}</Td>
                        </Tr>
                    ) : <></>}
                    {!!accountNumber ? (
                        <Tr>
                            <Td fontWeight="bold">Account number</Td>
                            <Td>{accountNumber}</Td>
                        </Tr>
                    ) : <></>}
                    <Tr>
                        <Td fontWeight="bold">Transactions</Td>
                        <Td>{transactions.length.toLocaleString()}</Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">Total debits</Td>
                        <Td>{currency(totalDebits)}</Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">Total credits</Td>
                        <Td>{currency(totalCredits)}</Td>
                    </Tr>
                </Tbody>
            </Table>
        </TableContainer>
    )
}

function UploadStatementForm({ statement, onSubmit }: {
    statement: ParsedStatement
    onSubmit(accountId: number): Promise<boolean>
}) {
    const { accounts = [], isLoading, error } = useAccounts()

    if (isLoading) {
        return <Loading />
    }

    if (error) {
        return <ErrorAlert error={error} />
    }

    const selectedAccount = !statement.accountNumber || !statement.sortCode
        ? null
        : accounts
            .filter(account => account.sortCode)
            .find(account =>
                account.accountNumber.trim() === statement.accountNumber?.trim()
                && account.sortCode?.replaceAll('-', '')?.trim() === statement.sortCode?.replace('-', '')?.trim()
            )

    if (!!statement.accountNumber && !!statement.sortCode && !selectedAccount) {
        return <ErrorAlert error={`Statement is for unknown account ${statement.sortCode} ${statement.accountNumber}`} />
    }

    return (
        <Stack spacing={4}>
            <ParsedStatementSummary statement={statement} />
            <Formik
                initialValues={{ accountId: selectedAccount?.id || 0 }}
                onSubmit={async (values, actions) => {
                    actions.setSubmitting(true)
                    if (await onSubmit(values.accountId)) {
                        actions.setSubmitting(false)
                        actions.resetForm()
                    }
                }}
            >
                {form => (
                    <Form>
                        <Stack spacing={4}>
                            <Field name="accountId">
                                {({field}: FieldProps<number, { accountId: number }>) => (
                                    <FormControl isRequired>
                                        <FormLabel>Account</FormLabel>
                                        <Select
                                            placeholder="Select account"
                                            {...field}
                                            isDisabled={!!selectedAccount}
                                            onChange={event => {
                                                const id = Number(event.target.value) || 0
                                                return form.setFieldValue('accountId', id)
                                            }}
                                        >
                                            {accounts.map(x =>
                                                <option key={`account-${x.id}`} value={x.id}>{x.bankName} - {x.accountName}</option>)}
                                        </Select>
                                    </FormControl>
                                )}
                            </Field>
                            <Button
                                leftIcon={<UploadIcon />}
                                variant="outline"
                                colorScheme="teal"
                                type="submit"
                                isLoading={form.isSubmitting}
                            >
                                Upload
                            </Button>
                        </Stack>
                    </Form>
                )}
            </Formik>

        </Stack>
    )
}

async function tryParseStatement(toast: CreateToastFnReturn, file: File): Promise<ParsedStatement | null> {
    try {
        return await parseStatementFile(file)
    } catch (e) {
        let description: string
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to parse statement',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return null
    }
}

async function uploadStatement(toast: CreateToastFnReturn, statement: NewStatement) {
    try {
        await statementApi.create(statement)
        await mutateStatements()
        toast({
            title: 'Success',
            description: "created new statement.",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof ApiError && e.status === 400 && e.body.includes('account does not exist')) {
            description = 'account does not exist'
        } else if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to create new statement',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

async function deleteStatement(toast: CreateToastFnReturn, statement: Statement) {
    try {
        await statementApi.delete(statement.id)
        await mutateStatements()
        toast({
            title: 'Success',
            description: `Deleted statement ${formatDateTimeLong(statement.dateUploaded)}.`,
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
            title: 'Failed to delete statement',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
    }
}