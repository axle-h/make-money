import {NextResponse} from "next/server";
import {notFound, OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {db} from "@/app/api/db";
import {Transaction} from "@/app/api/schema";

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
): Promise<OkOrErrorResponse<Transaction>> {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return notFound('transaction')
    }

    try {
        const transaction = await db.transactions.get(id)
        if (!transaction) {
            return notFound('transaction')
        }
        return NextResponse.json(transaction)
    } catch (e) {
        return toApiError(e)
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
): Promise<OkOrErrorResponse<Transaction>> {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return notFound('transaction')
    }

    try {
        const newTransaction = await request.json()
        const transaction = await db.transactions.update(id, newTransaction)
        if (!transaction) {
            return notFound('transaction')
        }
        return NextResponse.json(transaction)
    } catch (e) {
        return toApiError(e)
    }
}