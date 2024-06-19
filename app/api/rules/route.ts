import {OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {CategoryRule} from "@/app/api/schema";
import {NextResponse} from "next/server";
import {db} from "@/app/api/db";

export async function GET(): Promise<OkOrErrorResponse<CategoryRule[]>> {
    try {
        return NextResponse.json(await db.rules.list())
    } catch (e) {
        return toApiError(e)
    }
}

export async function POST(request: Request): Promise<OkOrErrorResponse<CategoryRule>> {
    try {
        const values = await request.json()
        const rule = await db.rules.create(values)
        return NextResponse.json(rule)
    } catch (e) {
        return toApiError(e)
    }
}