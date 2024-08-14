import useSWR, {mutate} from "swr";
import {Account, NewAccount} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import {apiQuery, ApiRequest, isApiKey} from "@/api-client/request";
import {mutateStatements} from "@/api-client/statements";
import {parseIsoUtcDatetime} from "@/components/dates";

export class AccountApi {
    async all(): Promise<Account[]> {
        const response = await fetch('/api/accounts')
        await assertOk(response, 'list accounts')

        const accounts: Account[] = await response.json()

        return accounts.map(({ statementsFrom, statementsTo, ...acc }) => ({
            statementsFrom: statementsFrom ? parseIsoUtcDatetime(statementsFrom) : null,
            statementsTo: statementsTo ? parseIsoUtcDatetime(statementsTo) : null,
            ...acc
        }))
    }

    async create(request: NewAccount) {
        const response = await fetch(
            '/api/accounts',
            {method: 'POST', body: JSON.stringify(request)}
        )
        await assertOk(response, 'create a new account')
    }

    async delete(id: number) {
        const response = await fetch(
            `/api/accounts/${id}`,
            {method: 'DELETE' }
        )
        await assertOk(response, 'delete account')
    }
}

export const accountApi = new AccountApi()

export function useAccounts() {
    const key = apiQuery('list-accounts', {})
    const {data: accounts, ...rest} = useSWR(key, () => accountApi.all())
    return {accounts, ...rest}
}

export async function mutateAccounts() {
    await mutate(key => isApiKey(key, 'list-accounts'))
    await mutateStatements()
}