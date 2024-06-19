import {CreateToastFnReturn} from "@chakra-ui/react";
import {categoriesApi, mutateCategories} from "@/api-client";
import {NewCategory} from "@/app/api/schema";
import {ApiError} from "@/api-client/error";

export async function createCategory(toast: CreateToastFnReturn, newCategory: NewCategory) {
    try {
        await categoriesApi.create(newCategory)
        await mutateCategories()
        toast({
            title: 'Success',
            description: "Created new category.",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof ApiError && e.status === 400 && e.body.includes('P2002')) {
            description = 'category already exists'
        } else if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to create new category',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

export async function updateCategory(toast: CreateToastFnReturn, id: number, values: NewCategory): Promise<boolean> {
    try {
        await categoriesApi.update(id, values)
        await mutateCategories()
        toast({
            title: 'Success',
            description: "Updated category.",
            status: 'success',
            duration: 2000,
            isClosable: true,
        })
        return true
    } catch (e) {
        let description: string
        if (e instanceof ApiError && e.status === 400 && e.body.includes('P2002')) {
            description = 'category already exists'
        } else if (e instanceof Error) {
            description = e.message
        } else {
            description = e?.toString() || 'an unknown error'
        }
        console.error(description);
        toast({
            title: 'Failed to update category',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}

export async function deleteCategory(toast: CreateToastFnReturn, id: number): Promise<boolean> {
    try {
        await categoriesApi.delete(id)
        await mutateCategories()
        toast({
            title: 'Success',
            description: "Deleted category.",
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
            title: 'Failed to delete category',
            description,
            status: 'error',
            duration: 5000,
            isClosable: true,
        })
        return false
    }
}