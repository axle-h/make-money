import React, {useState} from "react";
import { Box, HStack, IconButton, Menu, Stack, Table } from "@chakra-ui/react";
import {CheckIcon, DeleteIcon, EditIcon, MinusIcon, ViewIcon} from "@/components/icons";
import {MoreVerticalIcon} from "@/components/icons";
import {useCategoryStats} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {CreateOrUpdateCategoryDrawer} from "./create-or-update-category-drawer";
import {Category, NewCategory} from "@/app/api/schema";
import {CategoryTypeTag} from "./category-type-tag";
import {Tooltip} from "@/components/ui/tooltip";
import {CashFlow} from "@/components/cash-flow";

export interface CategoryTableProps {
    onDelete(id: number): Promise<boolean>
    onUpdate(id: number, values: NewCategory): Promise<boolean>
    onViewTransactions(id: number): void
}

export function CategoryTable({onDelete, onUpdate, onViewTransactions}: CategoryTableProps) {
    const {categories, isLoading, error} = useCategoryStats()

    if (isLoading) {
        return <Loading/>
    }

    if (error) {
        return <ErrorAlert error={error}/>
    }

    if (!categories || categories.length === 0) {
        return <NoData/>
    }

    const rows = categories.map(category => {
        const {id, name, emoji, report, type, subCategory, transactions, totalDebits, totalCredits} = category
        return (<Table.Row key={id}>
            <Table.Cell>
                {name} {emoji}
            </Table.Cell>
            <Table.Cell><CategoryTypeTag type={type} /></Table.Cell>
            <Table.Cell>{report ? <CheckIcon color="green" /> : <MinusIcon color="red" />}</Table.Cell>
            <Table.Cell>{subCategory ? <CheckIcon color="green" /> : <MinusIcon color="red" />}</Table.Cell>
            <Table.Cell>
                <HStack gap={2}>
                    <Box fontWeight={500}>{transactions}</Box>
                    <Stack>
                        <CashFlow amount={totalCredits} />
                        <CashFlow amount={totalDebits} />
                    </Stack>
                </HStack>

            </Table.Cell>
            <Table.Cell mx={0}>
                <CategoryMenu
                    category={category}
                    onDelete={transactions > 0 ? undefined : () => onDelete(id)}
                    onUpdate={values => onUpdate(id, values)}
                    onViewTransactions={() => onViewTransactions(id)}
                />
            </Table.Cell>
        </Table.Row>);
    })

    return (
        <Table.Root variant='line'>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Type</Table.ColumnHeader>
                    <Table.ColumnHeader>Report</Table.ColumnHeader>
                    <Table.ColumnHeader>Sub-Categorize</Table.ColumnHeader>
                    <Table.ColumnHeader>Transactions</Table.ColumnHeader>
                    <Table.ColumnHeader mx={0}></Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {rows}
            </Table.Body>
        </Table.Root>
    )
}

interface CategoryMenuProps {
    onUpdate(values: NewCategory): Promise<boolean>
    onDelete?(): Promise<boolean>
    onViewTransactions(): void
    category: Category
}

function CategoryMenu({onDelete, onUpdate, category, onViewTransactions}: CategoryMenuProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [openUpdate, setOpenUpdate] = useState(false)

    const DeleteMenuItem = (
        <Menu.Item
            value="delete-category"
            disabled={!onDelete || isDeleting}
            onClick={async () => {
                setIsDeleting(true)
                try {
                    if (onDelete) {
                        await onDelete()
                    }
                } finally {
                    setIsDeleting(false)
                }
            }}
        >
            <DeleteIcon/> Delete
        </Menu.Item>
    )

    return (
        <>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <IconButton variant="ghost">
                        <MoreVerticalIcon />
                    </IconButton>
                </Menu.Trigger>

                <Menu.Positioner>
                    <Menu.Content>
                        <Menu.Item value="view-transactions" onClick={() => onViewTransactions()}>
                            <ViewIcon/> View transactions
                        </Menu.Item>
                        <Menu.Item value="edit-category" onClick={() => setOpenUpdate(true)}>
                            <EditIcon /> Edit
                        </Menu.Item>
                        {!!onDelete ? DeleteMenuItem : (
                            <Tooltip showArrow content="Cannot delete a category with transactions">
                                {DeleteMenuItem}
                            </Tooltip>
                        )}
                    </Menu.Content>
                </Menu.Positioner>
            </Menu.Root>
            <CreateOrUpdateCategoryDrawer open={openUpdate} setOpen={setOpenUpdate} category={category} onSubmit={onUpdate} />
        </>
    )
}