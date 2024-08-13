import React, {useState} from "react";
import {
    Box,
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList, Stack, Stat, StatArrow, StatNumber,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr, useDisclosure
} from "@chakra-ui/react";
import {CheckIcon, DeleteIcon, EditIcon, MinusIcon, ViewIcon} from "@chakra-ui/icons";
import {MoreVerticalIcon} from "@/components/icons";
import {useCategoryStats} from "@/api-client";
import {ErrorAlert, Loading, NoData} from "@/components/alert";
import {CreateOrUpdateCategoryDrawer} from "./create-or-update-category-drawer";
import {Category, NewCategory} from "@/app/api/schema";
import {CategoryTypeTag} from "./category-type-tag";
import {CashFlow} from "../transactions/transaction-summary";

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
        return (<Tr key={id}>
            <Td>
                {name} {emoji}
            </Td>
            <Td><CategoryTypeTag type={type} /></Td>
            <Td>{report ? <CheckIcon color="green" /> : <MinusIcon color="red" />}</Td>
            <Td>{subCategory ? <CheckIcon color="green" /> : <MinusIcon color="red" />}</Td>
            <Td>
                <HStack spacing={2}>
                    <Box fontWeight={500}>{transactions}</Box>
                    <Stack>
                        <CashFlow amount={totalCredits} />
                        <CashFlow amount={totalDebits} />
                    </Stack>
                </HStack>

            </Td>
            <Td mx={0}>
                <CategoryMenu
                    category={category}
                    onDelete={transactions > 0 ? undefined : () => onDelete(id)}
                    onUpdate={values => onUpdate(id, values)}
                    onViewTransactions={() => onViewTransactions(id)}
                />
            </Td>
        </Tr>);
    })

    return (
        <>
            <TableContainer>
                <Table variant='simple'>
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Type</Th>
                            <Th>Report</Th>
                            <Th>Sub-Categorize</Th>
                            <Th>Transactions</Th>
                            <Th mx={0}></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {rows}
                    </Tbody>
                </Table>
            </TableContainer>
        </>
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
    const updateDisclosure = useDisclosure()

    const DeleteMenuItem = (
        <MenuItem
            icon={<DeleteIcon/>}
            isDisabled={!onDelete || isDeleting}
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
            Delete
        </MenuItem>
    )

    return (
        <>
            <Menu isLazy>
                <MenuButton as={IconButton} aria-label='Options' icon={<MoreVerticalIcon/>} variant="ghost"/>
                <MenuList>
                    <MenuItem
                        icon={<ViewIcon/>}
                        onClick={() => onViewTransactions()}
                    >
                        View transactions
                    </MenuItem>
                    <MenuItem icon={<EditIcon />} onClick={updateDisclosure.onOpen}>
                        Edit
                    </MenuItem>
                    {!!onDelete ? DeleteMenuItem : (
                        <Tooltip hasArrow label="Cannot delete a category with transactions">
                            {DeleteMenuItem}
                        </Tooltip>
                    )}
                </MenuList>
            </Menu>
            <CreateOrUpdateCategoryDrawer {...updateDisclosure} category={category} onSubmit={onUpdate} />
        </>
    )
}