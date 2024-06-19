import {PaginatedTransactionQuery, TransactionQuery} from "@/app/api/schema";

export interface QueryParams {
    accountId?: number
    statementId?: number
    categoryId?: number
    type?: string
    name?: string
    description?: string
    ruleId?: number
    uncategorized?: boolean
}

export interface PaginatedParams extends QueryParams {
    page: number
    orderBy: PaginatedTransactionQuery['orderBy']
    orderByDescending: boolean
}

export function toApiQuery(queryParams: QueryParams): TransactionQuery {
    const query: TransactionQuery = {
        accountId: queryParams.accountId,
        statementId: queryParams.statementId,
        categoryId: queryParams.categoryId,
        ruleId: queryParams.ruleId,
        type: queryParams.type,
    }
    if (queryParams.name) {
        query.name = {equals: queryParams.name}
    }
    if (queryParams.description) {
        query.description = {equals: queryParams.description}
    }
    if (queryParams.uncategorized) {
        query.uncategorized = true
    }
    return query
}