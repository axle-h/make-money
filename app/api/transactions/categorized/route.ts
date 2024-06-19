import {NextRequest, NextResponse} from "next/server";
import {OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {
    CategorizedTransaction,
    CategorizedTransactionQuery,
} from "@/app/api/schema";
import {parseSearchParams} from "@/app/api/query";
import {db} from "@/app/api/db";

export async function GET(request: NextRequest): Promise<OkOrErrorResponse<CategorizedTransaction[]>> {
    try {
        const query = parseSearchParams(request.nextUrl.searchParams)
        return NextResponse.json(await db.transactions.listCategorized(query as CategorizedTransactionQuery))
    } catch (e) {
        return toApiError(e)
    }
}