import {OkOrErrorResponse, toApiError} from "@/app/api/api-error";
import {CategoryStats} from "@/app/api/schema";
import {NextResponse} from "next/server";
import {db} from "@/app/api/db";

export async function GET(): Promise<OkOrErrorResponse<CategoryStats[]>> {
    try {
        return NextResponse.json(await db.categories.stats())
    } catch (e) {
        return toApiError(e)
    }
}