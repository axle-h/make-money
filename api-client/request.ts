import {Arguments, mutate} from "swr";
import {flattenObject} from "@/app/api/query";

export type ApiName =
    'list-accounts'
    | 'list-statements'
    | 'list-transactions' | 'get-transaction-meta' | 'list-transactions-categorized'
    | 'list-categories' | 'list-category-stats'
    | 'list-rules' | 'list-rule-predicates'

export interface ApiRequest<T extends ApiName> extends Record<string, string> {
    api: T
}

export function isApiKey(key: Arguments, ...apis: ApiName[]): boolean {
    return typeof key === 'object' && key !== null && 'api' in key && apis.includes(key.api)
}

export function mutateAll() {
    return mutate(() => true)
}

export function apiQuery<T extends ApiName>(api: T, searchParams: any): ApiRequest<T> {
    return { api, ...flattenObject(searchParams) }
}