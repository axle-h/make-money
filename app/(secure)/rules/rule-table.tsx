import {useRules, useTransactions} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {CategoryRule, NewCategoryRule, Statement} from "@/app/api/schema";
import {
    Code, IconButton,
    Menu,
    MenuButton, MenuItem, MenuList,
    Table,
    TableContainer,
    Tag,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useDisclosure
} from "@chakra-ui/react";
import React, {useState} from "react";
import {ListIcon, MoreVerticalIcon} from "@/components/icons";
import {DeleteIcon, EditIcon, ViewIcon} from "@chakra-ui/icons";
import {UpdateRuleDrawer} from "./update-rule-drawer";
import {Predicate} from "@/app/api/predicate";

export interface RuleTableProps {
    onDelete(id: number): Promise<boolean>
    onViewTransactions(rule: CategoryRule, uncategorized: boolean): void
    onUpdate(id: number, values: NewCategoryRule): Promise<boolean>
}

export function RuleTable({ onDelete, onViewTransactions, onUpdate }: RuleTableProps) {
    const {rules, isLoading, error} = useRules()
    const { transactions } = useTransactions({ page: 1, limit: 999, uncategorized: true })

    if (isLoading) {
        return <Loading/>
    }
    if (error) {
        return <ErrorAlert error={error}/>
    }
    if (!rules || rules.length === 0) {
        return <NoData/>
    }

    const uncategorizedTransactions = transactions?.data || []

    function RuleRow({rule}: { rule: CategoryRule }) {
        let uncategorizedCount: number | null = null
        try {
            const predicate = new Predicate(rule.predicate)
            uncategorizedCount = uncategorizedTransactions
                .filter(t => predicate.evaluate(t))
                .length
        } catch (e) {
            console.error(e)
        }

        const hasUncategorizedTransactions = uncategorizedCount !== null && uncategorizedCount > 0

        return (
            <Tr>
                <Td>{rule.name}</Td>
                <Td whiteSpace="initial">
                    <Code bgColor="transparent">
                        {rule.predicate}
                    </Code>
                </Td>
                <Td>
                    <Tag colorScheme="purple">{rule.categoryName}</Tag>
                </Td>
                <Td isNumeric color={hasUncategorizedTransactions ? 'red.500' : 'initial'}>
                    {uncategorizedCount === null ? <Loading /> : <>{uncategorizedCount}</>}
                </Td>
                <Td px={0}>
                    <RuleMenu
                        rule={rule}
                        onDelete={() => onDelete(rule.id)}
                        onViewTransactions={uncategorized => onViewTransactions(rule, uncategorized)}
                        onUpdate={values => onUpdate(rule.id, values)}
                        hasUncategorizedTransactions={hasUncategorizedTransactions}
                    />
                </Td>
            </Tr>
        )
    }

    return (
        <TableContainer>
            <Table variant='simple'>
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Rule</Th>
                        <Th>Category</Th>
                        <Th isNumeric>Uncategorized</Th>
                        <Th px={0}></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {rules.map(rule => <RuleRow key={rule.id} rule={rule}/>)}
                </Tbody>
            </Table>
        </TableContainer>
    )
}

interface RuleMenuProps {
    rule: CategoryRule
    onUpdate(values: NewCategoryRule): Promise<boolean>
    onDelete(): Promise<boolean>
    onViewTransactions(uncategorized: boolean): void
    hasUncategorizedTransactions: boolean
}

function RuleMenu({ rule, onDelete, onViewTransactions, onUpdate, hasUncategorizedTransactions }: RuleMenuProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const updateDisclosure = useDisclosure()

    return (
        <>
            <Menu isLazy>
                <MenuButton as={IconButton} aria-label='Options' icon={<MoreVerticalIcon/>} variant="ghost"/>
                <MenuList>
                    <MenuItem
                        icon={<ViewIcon/>}
                        onClick={() => onViewTransactions(false)}
                    >
                        View transactions
                    </MenuItem>
                    <MenuItem
                        icon={<ListIcon/>}
                        onClick={() => onViewTransactions(true)}
                        isDisabled={!hasUncategorizedTransactions}
                    >
                        Approve all uncategorized
                    </MenuItem>
                    <MenuItem icon={<EditIcon />} onClick={updateDisclosure.onOpen}>
                        Edit
                    </MenuItem>
                    <MenuItem
                        icon={<DeleteIcon/>}
                        isDisabled={isDeleting}
                        onClick={async () => {
                            setIsDeleting(true)
                            try {
                                await onDelete()
                            } finally {
                                setIsDeleting(false)
                            }
                        }}
                    >
                        Delete
                    </MenuItem>
                </MenuList>
            </Menu>
            <UpdateRuleDrawer {...updateDisclosure} rule={rule} onSubmit={onUpdate} />
        </>
    )
}