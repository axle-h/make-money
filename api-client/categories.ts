import {Category, CategoryStats, NewCategory} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import useSWR, {mutate} from "swr";
import {ApiRequest, isApiKey} from "@/api-client/request";
import {Prisma} from "@prisma/client";

export class CategoriesApi {
    async list(): Promise<Category[]> {
        const response = await fetch('/api/categories')
        await assertOk(response, 'list categories')
        return await response.json()
    }

    async stats(): Promise<CategoryStats[]> {
        const response = await fetch('/api/categories/stats')
        await assertOk(response, 'list category stats')
        const categories: CategoryStats[] = await response.json()
        return categories.map(cat => ({
            ...cat,
            totalCredits: new Prisma.Decimal(cat.totalCredits),
            totalDebits: new Prisma.Decimal(cat.totalDebits)
        }))
    }

    async create(newCategory: NewCategory) {
        const response = await fetch('/api/categories',
            { method: 'POST', body: JSON.stringify(newCategory) })
        await assertOk(response, 'create new category')
    }

    async update(id: number, values: NewCategory) {

        const response = await fetch(`/api/categories/${id}`,
            { method: 'PUT', body: JSON.stringify(values) })
        await assertOk(response, 'update category')
    }

    async delete(id: number) {
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
        await assertOk(response, 'delete category')
    }
}

export const categoriesApi = new CategoriesApi()

export function useCategories() {
    const key: ApiRequest<'list-categories'> = {api: 'list-categories'}
    const {data: categories, ...rest} = useSWR(key, () => categoriesApi.list())
    return {categories, ...rest}
}

export function useCategoryStats() {
    const key: ApiRequest<'list-category-stats'> = {api: 'list-category-stats'}
    const {data: categories, ...rest} = useSWR(key, () => categoriesApi.stats())
    return {categories, ...rest}
}

export async function mutateCategories() {
    await mutate(key => isApiKey(key, 'list-categories', 'list-category-stats'))
}