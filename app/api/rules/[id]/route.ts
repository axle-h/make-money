import {NextResponse} from "next/server";
import {notFound, OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {db} from "@/app/api/db";
import {CategoryRule} from "@/app/api/schema";

export const dynamic = 'force-dynamic'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params
    const id = parseInt(idString, 10)
    if (isNaN(id)) {
        return notFound('rule')
    }

    try {
        await db.rules.delete(id)
        return NextResponse.json({})
    } catch (e) {
        return toApiError(e)
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<OkOrErrorResponse<CategoryRule>> {
    const { id: idString } = await params
    const id = parseInt(idString, 10)
    if (isNaN(id)) {
        return notFound('rule')
    }

    try {
        const values = await request.json()
        const rule = await db.rules.update(id, values)
        return NextResponse.json(rule)
    } catch (e) {
        return toApiError(e)
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<OkOrErrorResponse<CategoryRule>> {
    const { id: idString } = await params
    const id = parseInt(idString, 10)
    if (isNaN(id)) {
        return notFound('rule')
    }

    try {
        const rule = await db.rules.get(id)
        if (!rule) {
            return notFound('rule')
        }
        return NextResponse.json(rule)
    } catch (e) {
        return toApiError(e)
    }
}