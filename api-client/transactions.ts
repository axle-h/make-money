import {apiQuery, ApiRequest, isApiKey} from "@/api-client/request";
import {
    Transaction,
    TransactionMeta,
    PaginatedTransactionQuery,
    TransactionQuery,
    UpdateTransactionRequest, CategorizedTransactionQuery, CategorizedTransaction
} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import {Paginated} from "@/app/api/paginated";
import {stringifySearchParams} from "@/app/api/query";
import useSWR, {mutate} from "swr";
import { Prisma } from '@prisma/client'
import {parseIsoUtcDate} from "@/components/dates";

export class TransactionApi {
    async list(query: PaginatedTransactionQuery): Promise<Paginated<Transaction>> {
        const response = await fetch('/api/transactions?' + stringifySearchParams(query))
        await assertOk(response, 'list transactions')
        const result: Paginated<Transaction> = await response.json()
        for (let item of result.data) {
            item.date = parseIsoUtcDate(item.date)
            item.amount = new Prisma.Decimal(item.amount)
        }
        return result
    }

    async listCategorized(query: CategorizedTransactionQuery): Promise<CategorizedTransaction[]> {
        const response = await fetch('/api/transactions/categorized?' + stringifySearchParams(query))
        await assertOk(response, 'list categorized transactions')
        const result: CategorizedTransaction[] = await response.json()
        for (let item of result) {
            item.date = parseIsoUtcDate(item.date)
            item.credit = new Prisma.Decimal(item.credit)
            item.debit = new Prisma.Decimal(item.debit)
        }
        return result
    }

    async meta(query: TransactionQuery): Promise<TransactionMeta> {
        const response = await fetch('/api/transactions/meta?' + stringifySearchParams(query))
        await assertOk(response, 'get transaction meta')
        return await response.json()
    }

    async update(id: number, values: UpdateTransactionRequest) {
        const response = await fetch(`/api/transactions/${id}`,
            { method: 'PUT', body: JSON.stringify(values) }
        )
        await assertOk(response, 'update transaction')
    }
}

export const transactionApi = new TransactionApi()

export function useTransactions(query: PaginatedTransactionQuery) {
    const key = apiQuery('list-transactions', query)
    const {data: transactions, ...rest} = useSWR(key, () => transactionApi.list(query))
    return {transactions, ...rest}
}

export function useUncategorizedTransactionCount() {
    const { transactions, isLoading } = useTransactions({ page: 1, limit: 1, uncategorized: true })
    return isLoading ? 0 : (transactions?.count || 0)
}

export function useCategorizedTransactions(query: CategorizedTransactionQuery) {
    const key = apiQuery('list-transactions-categorized', query)
    const {data: transactions, ...rest} = useSWR(key, () => transactionApi.listCategorized(query))
    return {transactions, ...rest}
}

export function useTransactionMeta(query: TransactionQuery) {
    const key = apiQuery('get-transaction-meta', query)
    const {data: transactionMeta, ...rest} = useSWR(key, () => transactionApi.meta(query))
    return {transactionMeta, ...rest}
}

export async function mutateTransactions() {
    await mutate(key => isApiKey(key, 'list-transactions', 'get-transaction-meta'))
}