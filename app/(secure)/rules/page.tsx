'use client'

import { Box, Collapsible, Heading } from "@chakra-ui/react";
import {mutateRules, ruleApi} from "@/api-client";
import { NewCategoryRule} from "@/app/api/schema";
import {AddIcon, DeleteIcon} from "@/components/icons";
import React from "react";
import {RuleTable} from "./rule-table";
import {NewRuleForm} from "./new-rule-form";
import {useRouter} from "next/navigation";
import {toaster} from "@/components/ui/toaster";
import {Button} from "@/components/ui/button";

export default function RulesPage({ searchParams }: { searchParams: Promise<{ newName?: string, newPredicate?: string }> }) {
    const router = useRouter()
    const { newName, newPredicate } = React.use(searchParams)

    return (
        <>
            <Heading size="4xl" mb={6}>Rules</Heading>
            <RuleControls
                onNewRule={async rule => {
                    const result = await createRule(rule)
                    if (result) {
                        router.replace('rules')
                    }
                    return result
                }}
                initialValues={{ predicate: newPredicate, name: newName }}
            />
            <RuleTable
                onDelete={id => deleteRule(id)}
                onUpdate={(id, values) => updateRule(id, values)}
                onViewTransactions={(rule, uncategorized) => {
                    const urlParams = new URLSearchParams()
                    urlParams.set('ruleId', rule.id.toString())
                    if (uncategorized) {
                        urlParams.set('uncategorized', 'true')
                        urlParams.set('bulkApproveName', `${rule.name} as ${rule.categoryName}`)
                    }
                    router.push('transactions?' + urlParams.toString())
                }}
            />
        </>
    )
}

function RuleControls({ onNewRule, initialValues }: { onNewRule(rule: NewCategoryRule): Promise<boolean>, initialValues?: Partial<NewCategoryRule> }) {
    return (
        <Collapsible.Root lazyMount defaultOpen={!!initialValues?.name || !!initialValues?.predicate} mb={4}>
            <Collapsible.Context>
                {({ open, setOpen }) =>
                    <>
                        <Collapsible.Trigger asChild>
                            <Button
                                variant="outline"
                                colorPalette={open ? 'gray' : 'teal'}
                            >
                                {open ? <DeleteIcon /> : <AddIcon />}
                                {open ? 'Cancel' : 'New Rule'}
                            </Button>
                        </Collapsible.Trigger>

                        <Collapsible.Content>
                            <Box
                                p={6}
                                mt={4}
                                bg='gray.700'
                                rounded='md'
                                shadow='md'
                            >
                                <NewRuleForm
                                    onSubmit={async rule => {
                                        const result = await onNewRule(rule)
                                        if (result) {
                                            setOpen(false)
                                        }
                                        return result
                                    }}
                                    initialValues={initialValues}
                                />
                            </Box>
                        </Collapsible.Content>
                    </>
                }
            </Collapsible.Context>
        </Collapsible.Root>
    )
}

async function createRule(newRule: NewCategoryRule) {
    try {
        await ruleApi.create(newRule)
        await mutateRules()
        toaster.create({
            title: 'Success',
            description: "Created new rule.",
            type: 'success',
            duration: 2000,
            closable: true,
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
        toaster.create({
            title: 'Failed to create new rule',
            description,
            type: 'error',
            duration: 5000,
            closable: true,
        })
        return false
    }
}

async function updateRule(id: number, values: NewCategoryRule) {
    try {
        await ruleApi.update(id, values)
        await mutateRules()
        toaster.create({
            title: 'Success',
            description: "Updated rule.",
            type: 'success',
            duration: 2000,
            closable: true,
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
        toaster.create({
            title: 'Failed to update rule',
            description,
            type: 'error',
            duration: 5000,
            closable: true,
        })
        return false
    }
}

async function deleteRule(id: number) {
    try {
        await ruleApi.delete(id)
        await mutateRules()
        toaster.create({
            title: 'Success',
            description: "Deleted rule.",
            type: 'success',
            duration: 2000,
            closable: true,
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
        toaster.create({
            title: 'Failed to delete rule',
            description,
            type: 'error',
            duration: 5000,
            closable: true,
        })
        return false
    }
}