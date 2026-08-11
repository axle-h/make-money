import { UpdateTransactionRequest, Schema, NewCategory } from '@/app/api/schema'
import { z, ZodError } from 'zod'

describe('schema', () => {
  describe('boolean', () => {
    it('true string', () =>
      expect(Schema.Boolean.parse('true')).toStrictEqual(true))
    it('true', () => expect(Schema.Boolean.parse(true)).toStrictEqual(true))
    it('false string', () =>
      expect(Schema.Boolean.parse('false')).toStrictEqual(false))
    it('false', () => expect(Schema.Boolean.parse(false)).toStrictEqual(false))
  })

  describe('paginated query', () => {
    it('sets defaults', () => {
      const observed = Schema.PaginatedQuery.parse({})
      expect(observed).toEqual({ page: 1, limit: 10 })
    })

    it('parses page & limit if req', () => {
      const observed = Schema.PaginatedQuery.parse({ page: '2', limit: '3' })
      expect(observed).toEqual({ page: 2, limit: 3 })
    })

    it('success on valid', () => {
      const observed = Schema.PaginatedQuery.parse({ page: 2, limit: 3 })
      expect(observed).toEqual({ page: 2, limit: 3 })
    })

    it('failed on invalid', () => {
      expect(() => Schema.PaginatedQuery.parse({ page: 0, limit: 0 })).toThrow(
        ZodError
      )
    })
  })

  describe('categorized transaction query', () => {
    // zod 4 changed the ordering of .default() relative to .transform().
    // Schema.Boolean is a transform, so this asserts the default still lands
    // as the boolean `false` rather than leaking the untransformed input.
    it('applies the boolean transform default', () => {
      const observed = Schema.CategorizedTransactionQuery.parse({})
      expect(observed).toEqual({ subCategories: false })
    })
  })

  describe('new account', () => {
    it('requires a sort code for current accounts', () => {
      const result = Schema.NewAccount.safeParse({
        bankName: 'some bank',
        accountNumber: '12345678',
        accountType: 'CURRENT_ACCOUNT',
      })
      expect(result.success).toBe(false)
      expect(z.flattenError(result.error!).fieldErrors).toEqual({
        sortCode: ['Sort code is required for current accounts'],
      })
    })

    it('rejects a sort code on credit cards', () => {
      const result = Schema.NewAccount.safeParse({
        bankName: 'some bank',
        accountNumber: '1234567890123456',
        sortCode: '112233',
        accountType: 'CREDIT_CARD',
      })
      expect(result.success).toBe(false)
      expect(z.flattenError(result.error!).fieldErrors).toEqual({
        sortCode: ['Sort code is not allowed for credit cards'],
      })
    })

    it('accepts a valid current account', () => {
      const account = {
        bankName: 'some bank',
        accountNumber: '12345678',
        sortCode: '112233',
        accountType: 'CURRENT_ACCOUNT' as const,
      }
      expect(Schema.NewAccount.parse(account)).toEqual(account)
    })
  })

  describe('approve transaction request', () => {
    it('validates single category', () => {
      const request: UpdateTransactionRequest = {
        categories: [{ id: 1, fraction: 1 }],
      }
      const observed = Schema.UpdateTransactionRequest.parse(request)
      expect(observed).toEqual(request)
    })

    it('validates multiple categories adding up to 1', () => {
      const request: UpdateTransactionRequest = {
        categories: [
          { id: 1, fraction: 0.8 },
          { id: 2, fraction: 0.2 },
        ],
      }
      const observed = Schema.UpdateTransactionRequest.parse(request)
      expect(observed).toEqual(request)
    })

    it('fails on duplicate categories', () => {
      expect(() =>
        Schema.UpdateTransactionRequest.parse({
          categories: [
            { id: 1, fraction: 0.8 },
            { id: 1, fraction: 0.2 },
          ],
        })
      ).toThrow(ZodError)
    })

    it('fails on categories not adding up to 1', () => {
      expect(() =>
        Schema.UpdateTransactionRequest.parse({
          categories: [
            { id: 1, fraction: 0.8 },
            { id: 2, fraction: 0.21 },
          ],
        })
      ).toThrow(ZodError)
    })

    it('successful on empty categories', () => {
      const request: UpdateTransactionRequest = { categories: [] }
      const observed = Schema.UpdateTransactionRequest.parse(request)
      expect(observed).toEqual(request)
    })
  })

  describe('new category', () => {
    it('accepts emojis', () => {
      const category: NewCategory = {
        type: 'EXPENSE',
        subCategory: false,
        emoji: '✈️️',
        report: true,
        name: 'CATEGORY1',
      }
      const observed = Schema.NewCategory.parse(category)
      expect(observed).toEqual(category)
    })

    it('accepts no emoji', () => {
      const category: NewCategory = {
        type: 'EXPENSE',
        subCategory: false,
        report: true,
        name: 'CATEGORY1',
      }
      const observed = Schema.NewCategory.parse(category)
      expect(observed).toEqual(category)
    })

    // TODO can get a decent emoji regex
    // it('rejects non-emojis', () => {
    //     const category: NewCategory = { type: 'EXPENSE', subCategory: false, emoji: 'A', report: true, name: 'CATEGORY1' }
    //     expect(() => Schema.NewCategory.parse(category)).toThrow(ZodError)
    // })
  })
})
