import useSWR, {mutate} from "swr";
import {Account, NewAccount} from "@/app/api/schema";
import {assertOk} from "@/api-client/error";
import {ApiRequest, isApiKey} from "@/api-client/request";
import {mutateTransactions} from "@/api-client/transactions";
import {mutateStatements} from "@/api-client/statements";
import {parseIsoUtcDate} from "@/components/dates";

export type ListAccountsRequest = ApiRequest<'list-accounts'>

export class AccountApi {
    async all(): Promise<Account[]> {
        const response = await fetch('/api/accounts')
        await assertOk(response, 'list accounts')

        const accounts: Account[] = await response.json()

        return accounts.map(({ statementsFrom, statementsTo, ...acc }) => ({
            statementsFrom: statementsFrom ? parseIsoUtcDate(statementsFrom) : null,
            statementsTo: statementsTo ? parseIsoUtcDate(statementsTo) : null,
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
    const key: ListAccountsRequest = {api: 'list-accounts'}
    const {data: accounts, ...rest} = useSWR(key, () => accountApi.all())
    return {accounts, ...rest}
}

export async function mutateAccounts() {
    await mutate(key => isApiKey(key, 'list-accounts'))
    await mutateStatements()
}