'use client'

import {Heading, useToast,} from "@chakra-ui/react";
import React from "react";
import {
    UncategorizedTransactionTableGroup
} from "./uncategorized-transaction-table";
import {useRouter} from "next/navigation";
import {approveTransaction, buildRuleUrl} from "../transactions/actions";
import {createCategory} from "../categories/actions";

export default function UncategorizedPage() {
    const toast = useToast({ position: 'top' })
    const router = useRouter()
    return (
        <>
            <Heading mb={6}>Uncategorized</Heading>
            <UncategorizedTransactionTableGroup
                onBuildRule={transaction => router.push(buildRuleUrl(transaction))}
                onApprove={(id, values) => approveTransaction(toast, id, values)}
                onCreateCategory={category => createCategory(toast, category)}
            />
        </>
    )
}



