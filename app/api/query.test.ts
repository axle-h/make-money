import {parseSearchParams, stringifySearchParams} from "@/app/api/query";

describe('stringify', () => {
    it('simple object', () => {
        const observed = stringifySearchParams({ a: '1', b: 2 })
        expect(Object.fromEntries(observed)).toEqual({ a: '1', b: '2' })
    })

    it('nested object', () => {
        const observed = stringifySearchParams({ a: { b: 1 } })
        expect(Object.fromEntries(observed)).toEqual({ 'a.b': '1' })
    })

    it('array', () => {
        const observed = stringifySearchParams({ arr: ['a', 'b'] })
        expect(Object.fromEntries(observed)).toEqual({ 'arr[0]': 'a', 'arr[1]': 'b' })
    })

    it('dates', () => {
        const observed = stringifySearchParams({ dt: new Date(2024, 0, 1, 12, 30, 0, 0) })
        expect(Object.fromEntries(observed)).toEqual({ dt: '2024-01-01T12:30:00.000Z' })
    })

    it('nested object in array', () => {
        const observed = stringifySearchParams({ arr: [{ a: 1, b: 2 }, { a: 3, b: 4 }] })
        expect(Object.fromEntries(observed)).toEqual({ 'arr[0].a': '1', 'arr[0].b': '2', 'arr[1].a': '3', 'arr[1].b': '4' })
    })
})


describe('parse', () => {
    it('simple object', () => {
        const observed = parseSearchParams(new URLSearchParams({ a: '1', b: '2' }))
        expect(observed).toEqual({ a: '1', b: '2' })
    })

    it('nested object', () => {
        const observed = parseSearchParams(new URLSearchParams({ 'a.b': '1' }))
        expect(observed).toEqual({ a: { b: '1' } })
    })

    it('array', () => {
        const observed = parseSearchParams(new URLSearchParams({ 'arr[0]': 'a', 'arr[1]': 'b' }))
        expect(observed).toEqual({ arr: ['a', 'b'] })
    })

    it('array with nested object', () => {
        const observed = parseSearchParams(new URLSearchParams({ 'arr[0].a': '1', 'arr[0].b': '2', 'arr[1].a': '3', 'arr[1].b': '4' }))
        expect(observed).toEqual({ arr: [{ a: '1', b: '2' }, { a: '3', b: '4' }] })
    })
})