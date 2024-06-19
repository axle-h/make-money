'use client'

import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertProps,
    AlertTitle,
    Box,
    Center,
    Spinner,
    Stack,
    Text
} from "@chakra-ui/react";
import React, {ReactNode, useEffect} from "react";
import {useAccounts, useUncategorizedTransactionCount} from "@/api-client";
import {needsNewStatement} from "@/components/dates";
import {Link} from "@chakra-ui/next-js";

export function ErrorAlert({ error, title = 'Something went wrong', ...props }: AlertProps & { error: any, title?: string }) {
    useEffect(() => console.log(error), [error]);
    return (<Alert {...props} status='error' variant='left-accent'>
        <AlertIcon />
        <Box>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {error.toString()}
            </AlertDescription>
        </Box>
    </Alert>)
}

export function Loading() {
    return <Center py={4}><Spinner /></Center>
}

export function NotFound({ entity, id }: { entity: string, id: string }) {
    return (<Alert status='error' variant='left-accent'>
        <AlertIcon />
        <Box>
            <AlertTitle style={{ textTransform: 'capitalize' }}>{entity} not found</AlertTitle>
            <AlertDescription>
                No {entity} exists with id {id}
            </AlertDescription>
        </Box>
    </Alert>)
}

export function NoData() {
    return (<Alert status='info' variant='left-accent'>
        <AlertIcon />
        <AlertTitle>No data</AlertTitle>
    </Alert>)
}

export function UpToDate() {
    return (<Alert status='success' variant='left-accent'>
        <AlertIcon />
        <AlertTitle>You&apos;re all up to date!</AlertTitle>
    </Alert>)
}

export function StatementAlerts() {
    const {accounts = []} = useAccounts()
    const uncategorizedTransactionCount = useUncategorizedTransactionCount()

    const badAccounts = accounts
        .filter(acc => !acc.statementsTo || needsNewStatement(acc.statementsTo))

    const alerts: ReactNode[] = []

    if (badAccounts.length > 0) {
        alerts.push(
            (
                <Alert status="warning" variant='left-accent' key="bad-accounts-alert">
                    <AlertIcon/>
                    <Box>
                        <AlertTitle>Stale data</AlertTitle>
                        <AlertDescription>
                            <Text>
                                <Link href="/statements">Upload your latest statement for accounts:</Link>
                                <Box as="span" fontWeight={600} ml={1}>
                                    {badAccounts.map(acc => `${acc.bankName} ${acc.accountName}`).join(', ')}
                                </Box>&nbsp;
                            </Text>
                            <Text>

                            </Text>
                        </AlertDescription>
                    </Box>
                </Alert>
            )
        )
    }

    if (uncategorizedTransactionCount > 0) {
        alerts.push(
            (
                <Alert status="error" variant='left-accent' key="uncategorized-alert">
                    <AlertIcon/>
                    <Box>
                        <AlertTitle>Uncategorized transactions</AlertTitle>
                        <AlertDescription>
                            Only approved transactions are reported.&nbsp;
                            <Link href="/uncategorized" textDecoration="underline">Approve uncategorized
                                transactions.</Link>
                        </AlertDescription>
                    </Box>
                </Alert>
            )
        )
    }


    if (alerts.length === 0) {
        return <></>
    }

    return (
        <Stack spacing={6} mb={6}>
            {alerts}
        </Stack>
    )
}