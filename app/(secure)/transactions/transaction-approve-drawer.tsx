import {
    Box,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay, HStack, Stack, Tag,
} from "@chakra-ui/react";
import React from "react";
import {Transaction, UpdateTransactionRequest} from "@/app/api/schema";
import {FocusableElement} from "@chakra-ui/utils";
import {TransactionApproveForm} from "./transaction-approve-form";

import {TransactionSummary} from "./transaction-summary";
import {useRulePredicates} from "@/api-client";
import {ErrorAlert, Loading} from "@/components/alert";

export interface TransactionApproveDrawerProps {
    isOpen: boolean
    onClose(): void
    transaction: Transaction
    onSubmit(values: UpdateTransactionRequest): Promise<boolean>
    onCreateNewCategory(): void
    onBuildRule(): void
}

export function TransactionApproveDrawer({isOpen, onClose, transaction, onSubmit, onBuildRule, onCreateNewCategory}: TransactionApproveDrawerProps) {
    const { rules = [], isLoading: loadingRules, error: ruleError } = useRulePredicates()
    const firstField = React.useRef<FocusableElement>(null)

    if (loadingRules) {
        return <Loading/>
    }

    if (ruleError) {
        return <ErrorAlert error={ruleError}/>
    }

    const ruleMatch= rules.find(rule => rule.predicate.evaluate(transaction))

    return (
        <Drawer
            isOpen={isOpen}
            placement='right'
            onClose={onClose}
            size="lg"
            initialFocusRef={firstField}
        >
            <DrawerOverlay/>
            <DrawerContent>
                <DrawerCloseButton/>
                <DrawerHeader>
                    Approve Transaction
                </DrawerHeader>

                <DrawerBody>
                    <Stack spacing={8}>
                        <Box w="100%">
                            <TransactionSummary transaction={transaction} ruleMatch={ruleMatch} />
                        </Box>
                        <TransactionApproveForm
                            transaction={transaction}
                            onSubmit={async values => {
                                const result = await onSubmit(values)
                                if (result) {
                                    onClose()
                                }
                                return result
                            }}
                            ref={firstField}
                            ruleMatch={ruleMatch}
                            onBuildRule={onBuildRule}
                            onCreateNewCategory={onCreateNewCategory}
                        />
                    </Stack>


                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}