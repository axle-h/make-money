'use client'

import {
    Box,
    Button,
    Collapse,
    CreateToastFnReturn,
    Heading,
    useDisclosure,
    useToast
} from "@chakra-ui/react";
import {mutateRules, ruleApi} from "@/api-client";
import { NewCategoryRule} from "@/app/api/schema";
import {AddIcon, DeleteIcon} from "@chakra-ui/icons";
import React from "react";
import {RuleTable} from "./rule-table";
import {NewRuleForm} from "./new-rule-form";
import {useRouter} from "next/navigation";

export default function RulesPage({ searchParams }: { searchParams: { newName?: string, newPredicate?: string } }) {
    const toast = useToast({ position: 'top' })
    const router = useRouter()

    return (
        <>
            <Heading mb={6}>Rules</Heading>
            <RuleControls
                onNewRule={async rule => {
                    const result = await createRule(toast, rule)
                    if (result) {
                        router.replace('rules')
                    }
                    return result
                }}
                initialValues={{ predicate: searchParams.newPredicate, name: searchParams.newName }}
            />
            <RuleTable
                onDelete={id => deleteRule(toast, id)}
                onUpdate={(id, values) => updateRule(toast, id, values)}
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
    const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen: !!initialValues?.name || !!initialValues?.predicate })
    return (
        <Box mb={4}>
            <Button
                onClick={onToggle}
                leftIcon={isOpen ? <DeleteIcon /> : <AddIcon />}
                variant="outline"
                colorScheme={isOpen ? 'gray' : 'teal'}
            >
                {isOpen ? 'Cancel' : 'New Rule'}
            </Button>
            <Collapse  in={isOpen} animateOpacity>
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
                                onClose()
                            }
                            return result
                        }}
                        initialValues={initialValues}
                    />
                </Box>
            </Collapse>
        </Box>
    )
}

async function createRule(toast: CreateToastFnReturn, newRule: NewCategoryRule) {
    try {
        await ruleApi.create(newRule)
        await mutateRules()
        toast({
            title: 'Success',
            description: "Created new rule.",
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
            title: 'Failed to create new rule',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

async function updateRule(toast: CreateToastFnReturn, id: number, values: NewCategoryRule) {
    try {
        await ruleApi.update(id, values)
        await mutateRules()
        toast({
            title: 'Success',
            description: "Updated rule.",
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
            title: 'Failed to update rule',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

async function deleteRule(toast: CreateToastFnReturn, id: number) {
    try {
        await ruleApi.delete(id)
        await mutateRules()
        toast({
            title: 'Success',
            description: "Deleted rule.",
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
            title: 'Failed to delete rule',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}