import { NextResponse } from "next/server";
import { db} from "@/app/api/db"
import {Account, NewAccount} from "@/app/api/schema"
import { OkOrErrorResponse, toApiError} from "@/app/api/api-error";

// export const dynamic = 'force-dynamic'

export async function GET(): Promise<OkOrErrorResponse<Account[]>> {
    try {
        return NextResponse.json(await db.accounts.all())
    } catch (e) {
        return toApiError(e)
    }
}

export async function POST(request: Request) : Promise<OkOrErrorResponse<Account, NewAccount>> {
    try {
        const newAccount = await request.json()
        const result = await db.accounts.create(newAccount)
        return NextResponse.json(result)
    } catch (e) {
        return toApiError(e)
    }
}