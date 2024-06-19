import {NextResponse} from "next/server";
import {notFound, OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {db} from "@/app/api/db";
import {Category} from "@/app/api/schema";


export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return notFound('category')
    }

    try {
        await db.categories.delete(id)
        return NextResponse.json({})
    } catch (e) {
        return toApiError(e)
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
): Promise<OkOrErrorResponse<Category>> {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
        return notFound('category')
    }

    try {
        const values = await request.json()
        const category = await db.categories.update(id, values)
        return NextResponse.json(category)
    } catch (e) {
        return toApiError(e)
    }
}