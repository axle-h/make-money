import {NextRequest, NextResponse} from "next/server";
import {db} from "@/app/api/db"
import {Statement, NewStatement, StatementQuery} from "@/app/api/schema"
import { OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {Paginated} from "@/app/api/paginated";
import { parseSearchParams} from "@/app/api/query";

// export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<OkOrErrorResponse<Paginated<Statement>>> {
    try {
        const query = parseSearchParams(request.nextUrl.searchParams)
        return NextResponse.json(await db.statements.list(query as StatementQuery))
    } catch (e) {
        return toApiError(e)
    }
}

export async function POST(request: Request) : Promise<OkOrErrorResponse<Statement, NewStatement>> {
    try {
        const newStatement = await request.json()
        const result = await db.statements.create(newStatement)
        return NextResponse.json(result)
    } catch (e) {
        return toApiError(e)
    }
}