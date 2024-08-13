import {CategoryRule, NewCategoryRule} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import {apiQuery, ApiRequest, isApiKey} from "@/api-client/request";
import useSWR, {mutate} from "swr";
import {Predicate} from "@/app/api/predicate";
import {mutateTransactions} from "@/api-client/transactions";
import {mutateCategories} from "@/api-client/categories";

export class RulesApi {
    async get(id: number): Promise<CategoryRule | null> {
        const response = await fetch(`/api/rules/${id}`)
        await assertOk(response, 'get rule')
        return await response.json()
    }

    async list(): Promise<CategoryRule[]> {
        const response = await fetch('/api/rules')
        await assertOk(response, 'list rules')
        return await response.json()
    }

    async create(newRule: NewCategoryRule) {
        const response = await fetch('/api/rules',
            { method: 'POST', body: JSON.stringify(newRule) })
        await assertOk(response, 'create new rule')
    }

    async update(id: number, values: NewCategoryRule) {
        const response = await fetch(`/api/rules/${id}`,
            { method: 'PUT', body: JSON.stringify(values) })
        await assertOk(response, 'update rule')
    }

    async delete(id: number) {
        const response = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
        await assertOk(response, 'delete rule')
    }
}

export const ruleApi = new RulesApi()

export function useRules() {
    const key = apiQuery('list-rules', {})
    const {data: rules, ...rest} = useSWR(key, () => ruleApi.list())
    return {rules, ...rest}
}

export function useRulePredicates() {
    const key = apiQuery('list-rule-predicates', {})
    const {data: rules, ...rest} = useSWR(key, async () => {
        const rules = await ruleApi.list()
        return rules.map(({ predicate, ...rule }) => ({
            ...rule,
            predicate: new Predicate(predicate)
        } as CategoryRulePredicate))
    })
    return {rules, ...rest}
}

export interface CategoryRulePredicate extends Omit<CategoryRule, 'predicate'> {
    predicate: Predicate
}

export async function mutateRules() {
    await mutate(key => isApiKey(key, 'list-rules', 'list-rule-predicates'))
    await mutateTransactions()
    await mutateCategories()
}