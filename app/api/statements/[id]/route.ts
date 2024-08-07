import {NextResponse} from "next/server";
import {notFound, toApiError} from "@/app/api/api-error";
import {db} from "@/app/api/db";

export const dynamic = 'force-dynamic'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return notFound('statement')
    }

    try {
        await db.statements.delete(id)
        return NextResponse.json({})
    } catch (e) {
        return toApiError(e)
    }
}