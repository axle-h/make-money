import {ApiRequest, isApiKey} from "@/api-client/request";
import {NewStatement, Statement, StatementQuery} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import {Paginated} from "@/app/api/paginated";
import {stringifySearchParams} from "@/app/api/query";
import useSWR, {mutate} from "swr";
import {mutateTransactions} from "@/api-client/transactions";
import { UTCDate } from '@date-fns/utc'
import {parseIsoUtcDate} from "@/components/dates";

export type ListStatementsRequest = ApiRequest<'list-statements'> & StatementQuery

export class StatementApi {
    async list(query: StatementQuery): Promise<Paginated<Statement>> {
        const response = await fetch('/api/statements?' + stringifySearchParams(query))
        await assertOk(response, 'list statements')
        const result: Paginated<Statement> = await response.json()
        for (let item of result.data) {
            item.dateUploaded = parseIsoUtcDate(item.dateUploaded)
            item.startDate = parseIsoUtcDate(item.startDate)
            item.endDate = parseIsoUtcDate(item.endDate)
        }
        return result
    }

    async create(request: NewStatement) {
        const response = await fetch(
            '/api/statements',
            {method: 'POST', body: JSON.stringify(request)}
        )
        await assertOk(response, 'create a new statement')
    }

    async delete(id: number) {
        const response = await fetch(
            `/api/statements/${id}`,
            {method: 'DELETE' }
        )
        await assertOk(response, 'delete statement')
    }
}

export const statementApi = new StatementApi()

export function useStatements(query: StatementQuery) {
    const key: ListStatementsRequest = {api: 'list-statements', ...query}
    const {data: statements, ...rest} = useSWR(key, () => statementApi.list(query))
    return {statements, ...rest}
}

export async function mutateStatements() {
    await mutate(key => isApiKey(key, 'list-statements'))
    await mutateTransactions()
}