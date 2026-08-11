import { toApiError } from '@/app/api/api-error'
import { Schema } from '@/app/api/schema'
import { ZodError } from 'zod'

describe('toApiError', () => {
  // Regression guard: validation failures must stay on the 400 path. zod 4's
  // ZodError inheritance from Error is inconsistent between parse-produced and
  // directly constructed instances, so this is easy to break by reordering the
  // type checks in toApiError.
  it('maps a ZodError to 400 with field errors', async () => {
    const result = Schema.NewAccount.safeParse({
      bankName: 'some bank',
      accountNumber: '12345678',
      accountType: 'CURRENT_ACCOUNT',
    })
    expect(result.success).toBe(false)

    const response = toApiError(result.error as ZodError)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      formErrors: [],
      fieldErrors: {
        sortCode: ['Sort code is required for current accounts'],
      },
    })
  })

  it('maps an unknown error to 500', async () => {
    const response = toApiError(new Error('boom'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'boom', name: 'Error' })
  })

  it('maps a non-Error throwable to 500', async () => {
    const response = toApiError('just a string')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      message: 'just a string',
      name: 'unknown',
    })
  })
})
