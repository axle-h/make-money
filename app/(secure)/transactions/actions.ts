import {CreateToastFnReturn} from "@chakra-ui/react";
import {mutateTransactions, ruleApi, transactionApi} from "@/api-client";
import {Transaction, UpdateTransactionRequest} from "@/app/api/schema";
import {CategoryRule} from "@prisma/client";

export async function resetTransactionCategories(toast: CreateToastFnReturn, id: number) {
    try {
        await transactionApi.update(id, {categories: []})
        await mutateTransactions()
        toast({
            title: 'Success',
            description: `Reset categories.`,
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to reset categories',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}


export async function approveAllTransactionsForRule(toast: CreateToastFnReturn, ruleId: number) {
    let lastError: string | null = null

    let rule: CategoryRule | null
    try {
        rule = await ruleApi.get(ruleId)
    } catch (e) {
        let description
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description)
        toast({
            title: 'Failed to retrieve category rule',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }

    if (!rule) {
        toast({
            title: 'Success',
            description: "Category rule does not exist",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return false
    }

    let ids: number[]
    try {
        const transactions = await transactionApi.list({ page: 1, limit: 1000, ruleId, uncategorized: true })
        ids = transactions.data.map(t => t.id)
    } catch (e) {
        let description
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description)
        toast({
            title: 'Failed to retrieve uncategorized transactions',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }

    if (ids.length === 0) {
        toast({
            title: 'Success',
            description: "No uncategorized transactions found for this rule",
            status: 'error',
            duration: 2000,
            isClosable: true,
        })
        return true
    }

    const promises = ids.map(async id => {
        try {
            await transactionApi.update(id, {
                notes: rule.name,
                categories: [{ id: rule.categoryId, fraction: 1 }]
            })
        } catch (e) {
            let description
            if (e instanceof Error) {
                description = e.message
            } else {
                description = e?.toString() || 'an unknown error'
            }
            console.error(description)
            lastError = description
        }
    })
    await Promise.all(promises)

    await mutateTransactions()

    if (lastError) {
        toast({
            title: 'Failed to approve transactions',
            description: lastError,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }

    toast({
        title: 'Success',
        description: "Approved transactions.",
        status: 'success',
        duration: 2000,
        isClosable: true,
    })
    return true
}

export async function approveTransaction(toast: CreateToastFnReturn, id: number, values: UpdateTransactionRequest) {
    try {
        await transactionApi.update(id, values)
        await mutateTransactions()
        toast({
            title: 'Success',
            description: "Approved transaction.",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description)
        toast({
            title: 'Failed to approve transaction',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

function cleanStringLiteral(s: string) {
    return s.replaceAll('\'', '\\\'')
}

export function buildRuleUrl({name, description, type}: Transaction) {
    const urlParams = new URLSearchParams()
    urlParams.set('newName', toTitleCase(name))
    urlParams.set(
        'newPredicate',
        `name == '${cleanStringLiteral(name)}' AND description == '${cleanStringLiteral(description)}' AND type == '${cleanStringLiteral(type)}'`
    )
    return 'rules?' + urlParams.toString()
}

function toTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}