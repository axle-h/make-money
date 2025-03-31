'use client'

import {
    Alert, AlertIndicator,
    Box,
    Center,
    Spinner,
    Stack,
    Text
} from "@chakra-ui/react";
import React, {ReactNode, useEffect} from "react";
import {useAccounts, useUncategorizedTransactionCount} from "@/api-client";
import {needsNewStatement} from "@/components/dates";
import {Link} from "@/components/link";

type AlertProps = Alert.RootProps

function LeftAccentAlert(props: AlertProps) {
    return <Alert.Root {...props} variant="subtle" borderStartWidth="3px" borderStartColor="colorPalette.600" />
}

export function ErrorAlert({ error, title = 'Something went wrong', ...props }: AlertProps & { error: any, title?: string }) {
    useEffect(() => console.log(error), [error]);
    return (<LeftAccentAlert {...props} status='error'>
        <Alert.Indicator />
        <Box>
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>
                {error.toString()}
            </Alert.Description>
        </Box>
    </LeftAccentAlert>)
}

export function Loading() {
    return <Center py={4}><Spinner /></Center>
}

export function NotFound({ entity, id }: { entity: string, id: string }) {
    return (<LeftAccentAlert status='error'>
        <Alert.Indicator />
        <Box>
            <Alert.Title style={{ textTransform: 'capitalize' }}>{entity} not found</Alert.Title>
            <Alert.Description>
                No {entity} exists with id {id}
            </Alert.Description>
        </Box>
    </LeftAccentAlert>)
}

export function NoData() {
    return (<LeftAccentAlert status='info'>
        <Alert.Indicator />
        <Alert.Title>No data</Alert.Title>
    </LeftAccentAlert>)
}

export function UpToDate() {
    return (<LeftAccentAlert status='success'>
        <Alert.Indicator />
        <Alert.Title>You&apos;re all up to date!</Alert.Title>
    </LeftAccentAlert>)
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
                <LeftAccentAlert status="warning" key="bad-accounts-alert">
                    <AlertIndicator />
                    <Box>
                        <Alert.Title>Stale data</Alert.Title>
                        <Alert.Description>
                            <Text>
                                <Link href="/statements">Upload your latest statement for accounts:</Link>
                                <Box as="span" fontWeight={600} ml={1}>
                                    {badAccounts.map(acc => `${acc.bankName} ${acc.accountName}`).join(', ')}
                                </Box>&nbsp;
                            </Text>
                            <Text>

                            </Text>
                        </Alert.Description>
                    </Box>
                </LeftAccentAlert>
            )
        )
    }

    if (uncategorizedTransactionCount > 0) {
        alerts.push(
            (
                <LeftAccentAlert status="error" key="uncategorized-alert">
                    <AlertIndicator />
                    <Box>
                        <Alert.Title>Uncategorized transactions</Alert.Title>
                        <Alert.Description>
                            Only approved transactions are reported.&nbsp;
                            <Link href="/uncategorized" textDecoration="underline">Approve uncategorized
                                transactions.</Link>
                        </Alert.Description>
                    </Box>
                </LeftAccentAlert>
            )
        )
    }


    if (alerts.length === 0) {
        return <></>
    }

    return (
        <Stack gap={6} mb={6}>
            {alerts}
        </Stack>
    )
}