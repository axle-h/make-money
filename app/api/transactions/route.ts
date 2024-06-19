import {NextRequest, NextResponse} from "next/server";
import {OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {Paginated} from "@/app/api/paginated";
import {Transaction, PaginatedTransactionQuery} from "@/app/api/schema";
import {parseSearchParams} from "@/app/api/query";
import {db} from "@/app/api/db";

export async function GET(request: NextRequest): Promise<OkOrErrorResponse<Paginated<Transaction>>> {
    try {
        const query = parseSearchParams(request.nextUrl.searchParams)
        return NextResponse.json(await db.transactions.list(query as PaginatedTransactionQuery))
    } catch (e) {
        return toApiError(e)
    }
}