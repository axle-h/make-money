'use client'

import {Button, ButtonGroup, Heading, useDisclosure, useToast,} from "@chakra-ui/react";
import React from "react";
import {NewCategory} from "@/app/api/schema";
import {AddIcon} from "@chakra-ui/icons";
import {CategoryTable} from "./category-table";
import {useRouter} from "next/navigation";
import {CreateOrUpdateCategoryDrawer} from "./create-or-update-category-drawer";
import {createCategory, deleteCategory, updateCategory} from "./actions";

export default function CategoriesPage() {
    const toast = useToast({ position: 'top' })
    const router = useRouter()
    return (
        <>
            <Heading mb={6}>Categories</Heading>
            <CategoryControls onCreate={c => createCategory(toast, c)} />
            <CategoryTable
                onDelete={id => deleteCategory(toast, id)}
                onUpdate={(id, values) => updateCategory(toast, id, values)}
                onViewTransactions={id => router.push(`transactions?categoryId=${id}`)}
            />
        </>
    )
}

function CategoryControls({ onCreate }: { onCreate(category: NewCategory): Promise<boolean> }) {
    const { isOpen, onOpen, onClose } = useDisclosure()

    return (
        <>
            <ButtonGroup variant='outline' mb={4}>
                <Button colorScheme='teal' leftIcon={<AddIcon />} onClick={onOpen}>New Category</Button>
            </ButtonGroup>
            <CreateOrUpdateCategoryDrawer isOpen={isOpen} onClose={onClose} onSubmit={onCreate} />
        </>
    )
}

