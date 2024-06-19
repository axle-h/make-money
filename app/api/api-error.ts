import {typeToFlattenedError, ZodError} from "zod";
import {NextResponse} from "next/server";
import {tryHandleDbError} from "@/app/api/db";

export interface UnknownApiError {
    message: string
    name: string
}

export type ApiError<T> = UnknownApiError | typeToFlattenedError<T>

export type OkOrErrorResponse<T, E = T> = NextResponse<T | ApiError<E>>

export function toApiError<T>(e: any): NextResponse<ApiError<T>> {
    console.error(e)

    if (!(e instanceof Error)) {
        return NextResponse.json({ message: e?.toString() ?? 'Unknown error', name: 'unknown' }, { status: 500 })
    }

    if (e instanceof ZodError) {
        return NextResponse.json(e.flatten(), { status: 400 })
    }

    const dbError = tryHandleDbError(e)
    if (dbError !== null) {
        return NextResponse.json(
            { message: dbError.message, name: dbError.name },
            { status: dbError.badRequest ? 400 : 500 }
        )
    }
    return NextResponse.json({ message: e.message.trim(), name: e.name }, { status: 500 })
}

export function notFound(entity: string): NextResponse<UnknownApiError> {
    return NextResponse.json({
        message: `${entity} does not exist`,
        name: 'NotFound'
    }, { status: 404 })
}