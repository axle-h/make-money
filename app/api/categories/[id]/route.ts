import { NextResponse } from 'next/server'
import { notFound, OkOrErrorResponse, toApiError } from '@/app/api/api-error'
import { db } from '@/app/api/db'
import { Category } from '@/app/api/schema'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idString } = await params
  const id = parseInt(idString, 10)
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
  { params }: { params: Promise<{ id: string }> }
): Promise<OkOrErrorResponse<Category>> {
  const { id: idString } = await params
  const id = parseInt(idString, 10)
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
