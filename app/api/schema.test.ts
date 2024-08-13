import {UpdateTransactionRequest, Schema, NewCategory} from "@/app/api/schema"
import {ZodError} from "zod";

describe('schema', () => {
    describe('boolean', () => {
        it('true string', () => expect(Schema.Boolean.parse('true')).toStrictEqual(true))
        it('true', () => expect(Schema.Boolean.parse(true)).toStrictEqual(true))
        it('false string', () => expect(Schema.Boolean.parse('false')).toStrictEqual(false))
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
            expect(() => Schema.PaginatedQuery.parse({ page: 0, limit: 0 })).toThrow(ZodError)
        })
    })

    describe('approve transaction request', () => {
        it('validates single category', () => {
            const request: UpdateTransactionRequest = { categories: [{ id: 1, fraction: 1 }] }
            const observed = Schema.UpdateTransactionRequest.parse(request)
            expect(observed).toEqual(request)
        })

        it('validates multiple categories adding up to 1', () => {
            const request: UpdateTransactionRequest = { categories: [{ id: 1, fraction: 0.8 }, { id: 2, fraction: 0.2 }] }
            const observed = Schema.UpdateTransactionRequest.parse(request)
            expect(observed).toEqual(request)
        })

        it('fails on duplicate categories', () => {
            expect(() => Schema.UpdateTransactionRequest.parse({ categories: [{ id: 1, fraction: 0.8 }, { id: 1, fraction: 0.2 }] }))
                .toThrow(ZodError)
        })

        it('fails on categories not adding up to 1', () => {
            expect(() => Schema.UpdateTransactionRequest.parse({ categories: [{ id: 1, fraction: 0.8 }, { id: 2, fraction: 0.21 }] }))
                .toThrow(ZodError)
        })

        it('successful on empty categories', () => {
            const request: UpdateTransactionRequest = { categories: [] }
            const observed = Schema.UpdateTransactionRequest.parse(request)
            expect(observed).toEqual(request)
        })
    })

    describe('new category', () => {
        it('accepts emojis', () => {
            const category: NewCategory = { type: 'EXPENSE', subCategory: false, emoji: '👍', report: true, name: 'CATEGORY1' }
            const observed = Schema.NewCategory.parse(category)
            expect(observed).toEqual(category)
        })

        it('accepts no emoji', () => {
            const category: NewCategory = { type: 'EXPENSE', subCategory: false, report: true, name: 'CATEGORY1' }
            const observed = Schema.NewCategory.parse(category)
            expect(observed).toEqual(category)
        })

        it('rejects non-emojis', () => {
            const category: NewCategory = { type: 'EXPENSE', subCategory: false, emoji: 'A', report: true, name: 'CATEGORY1' }
            expect(() => Schema.NewCategory.parse(category)).toThrow(ZodError)
        })
    })
})