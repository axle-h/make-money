import {NextRequest, NextResponse} from "next/server";
import {OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {db} from "@/app/api/db";
import {TransactionMeta, TransactionQuery} from "@/app/api/schema";
import {parseSearchParams} from "@/app/api/query";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<OkOrErrorResponse<TransactionMeta>> {
    try {
        const query = parseSearchParams(request.nextUrl.searchParams)
        return NextResponse.json(await db.transactions.meta(query as TransactionQuery))
    } catch (e) {
        return toApiError(e)
    }
}