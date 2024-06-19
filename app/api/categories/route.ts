import { NextResponse} from "next/server";
import { OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {Category} from "@/app/api/schema";
import {db} from "@/app/api/db";

export async function GET(): Promise<OkOrErrorResponse<Category[]>> {
    try {
        return NextResponse.json(await db.categories.list())
    } catch (e) {
        return toApiError(e)
    }
}

export async function POST(request: Request): Promise<OkOrErrorResponse<Category>> {
    try {
        const newCategory = await request.json()
        const category = await db.categories.create(newCategory)
        return NextResponse.json(category)
    } catch (e) {
        return toApiError(e)
    }
}