import { z, ZodError } from 'zod'
import { NextResponse } from 'next/server'
import { tryHandleDbError } from '@/app/api/db'

export interface UnknownApiError {
  message: string
  name: string
}

export type ApiError<T> = UnknownApiError | z.core.$ZodFlattenedError<T>

export type OkOrErrorResponse<T, E = T> = NextResponse<T | ApiError<E>>

export function toApiError<T>(e: any): NextResponse<ApiError<T>> {
  console.error(e)

  // Checked before the `instanceof Error` guard below. In zod 4 a ZodError
  // raised by parsing does inherit from Error, but a directly constructed one
  // does not, so matching the specific type first keeps validation failures on
  // the 400 path either way.
  if (e instanceof ZodError) {
    return NextResponse.json(z.flattenError(e), { status: 400 })
  }

  if (!(e instanceof Error)) {
    return NextResponse.json(
      { message: e?.toString() ?? 'Unknown error', name: 'unknown' },
      { status: 500 }
    )
  }

  const dbError = tryHandleDbError(e)
  if (dbError !== null) {
    return NextResponse.json(
      { message: dbError.message, name: dbError.name },
      { status: dbError.badRequest ? 400 : 500 }
    )
  }
  return NextResponse.json(
    { message: e.message.trim(), name: e.name },
    { status: 500 }
  )
}

export function notFound(entity: string): NextResponse<UnknownApiError> {
  return NextResponse.json(
    {
      message: `${entity} does not exist`,
      name: 'NotFound',
    },
    { status: 404 }
  )
}
