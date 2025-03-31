import { Box, Drawer, Stack } from "@chakra-ui/react";
import React from "react";
import {Transaction, UpdateTransactionRequest} from "@/app/api/schema";
import {TransactionApproveForm} from "./transaction-approve-form";

import {TransactionSummary} from "./transaction-summary";
import {useRulePredicates} from "@/api-client";
import {ErrorAlert, Loading} from "@/components/alert";

export interface TransactionApproveDrawerProps {
    open: boolean
    setOpen(open: boolean): void
    transaction: Transaction
    onSubmit(values: UpdateTransactionRequest): Promise<boolean>
    onCreateNewCategory(): void
    onBuildRule(): void
}

export function TransactionApproveDrawer({open, setOpen, transaction, onSubmit, onBuildRule, onCreateNewCategory}: TransactionApproveDrawerProps) {
    const { rules = [], isLoading: loadingRules, error: ruleError } = useRulePredicates()
    const firstField = React.useRef<HTMLInputElement>(null)

    if (loadingRules) {
        return <></>
    }

    if (ruleError) {
        return <ErrorAlert error={ruleError}/>
    }

    const ruleMatch= rules.find(rule => rule.predicate.evaluate(transaction))

    return (
        <Drawer.Root
            open={open}
            placement='end'
            onOpenChange={(e) => setOpen(e.open)}
            size="lg"
            initialFocusEl={() => firstField.current}
        >
            <Drawer.Backdrop />
            <Drawer.Positioner>
                <Drawer.Content>
                    <Drawer.CloseTrigger />
                    <Drawer.Header>
                        Approve Transaction
                    </Drawer.Header>

                    <Drawer.Body>
                        <Stack gap={8}>
                            <Box w="100%">
                                <TransactionSummary transaction={transaction} ruleMatch={ruleMatch} />
                            </Box>
                            <TransactionApproveForm
                                transaction={transaction}
                                onSubmit={async values => {
                                    const result = await onSubmit(values)
                                    if (result) {
                                        setOpen(false)
                                    }
                                    return result
                                }}
                                ref={firstField}
                                ruleMatch={ruleMatch}
                                onBuildRule={onBuildRule}
                                onCreateNewCategory={onCreateNewCategory}
                            />
                        </Stack>


                    </Drawer.Body>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    )
}