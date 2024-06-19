import { Prisma } from '@prisma/client'
import {Predicate, PredicateParseError} from './predicate';
import {EXAMPLE_TRANSACTION} from "@/app/api/schema";  // Adjust the import based on your file structure

describe('predicate', () => {
    test('simple AND condition', () => {
        const predicate = new Predicate("a == 'X' AND b == 'Y'")
        expect(predicate.evaluate({ a: 'X', b: 'Y' })).toBe(true)
        expect(predicate.evaluate({ a: 'X', b: 'X' })).toBe(false)
    })

    test('simple OR condition', () => {
        const predicate = new Predicate("a == 'X' OR b == 'Y'")
        expect(predicate.evaluate({ a: 'X', b: 'ANY' })).toBe(true)
        expect(predicate.evaluate({ a: 'ANY', b: 'Y' })).toBe(true)
        expect(predicate.evaluate({ a: 'NONE', b: 'NONE' })).toBe(false)
    })

    test('correct operator precedence', () => {
        const predicate = new Predicate("a == 'X' AND b == 'Y' OR a == 'Z'")
        expect(predicate.evaluate({ a: 'X', b: 'Y' })).toBe(true)
        expect(predicate.evaluate({ a: 'X', b: 'NONE' })).toBe(false)
        expect(predicate.evaluate({ a: 'Z', b: 'NONE' })).toBe(true)
    })

    test('parentheses', () => {
        const predicate = new Predicate("a == 'X' AND (b == 'Y' OR b == 'Z')")
        expect(predicate.evaluate({ a: 'X', b: 'Y' })).toBe(true)
        expect(predicate.evaluate({ a: 'X', b: 'Z' })).toBe(true)
        expect(predicate.evaluate({ a: 'X', b: 'NONE' })).toBe(false)
        expect(predicate.evaluate({ a: 'NONE', b: 'Y' })).toBe(false)
    })

    test('inequality', () => {
        const predicate = new Predicate("a != 'X' AND b != 'Y'")
        expect(predicate.evaluate({ a: 'Y', b: 'X' })).toBe(true)
        expect(predicate.evaluate({ a: 'X', b: 'Y' })).toBe(false)
        expect(predicate.evaluate({ a: 'ANY', b: 'Y' })).toBe(false)
        expect(predicate.evaluate({ a: 'X', b: 'ANY' })).toBe(false)
    })

    test('supports numbers', () => {
        const predicate = new Predicate("a == 1")
        expect(predicate.evaluate({ a: 1 })).toBe(true)
        expect(predicate.evaluate({ a: 2 })).toBe(false)
        expect(predicate.evaluate({ a: '1' })).toBe(false)
    })

    test('supports null', () => {
        const predicate = new Predicate("a == null")
        expect(predicate.evaluate({ a: null })).toBe(true)
        expect(predicate.evaluate({ a: 'X' })).toBe(false)
    })

    test('greater than', () => {
        const predicate = new Predicate("a > 1")
        expect(predicate.evaluate({ a: 0 })).toBe(false)
        expect(predicate.evaluate({ a: 1 })).toBe(false)
        expect(predicate.evaluate({ a: 2 })).toBe(true)
    })

    test('greater than or equal to', () => {
        const predicate = new Predicate("a >= 1")
        expect(predicate.evaluate({ a: 0 })).toBe(false)
        expect(predicate.evaluate({ a: 1 })).toBe(true)
        expect(predicate.evaluate({ a: 2 })).toBe(true)
    })

    test('less than', () => {
        const predicate = new Predicate("a < 1")
        expect(predicate.evaluate({ a: 0 })).toBe(true)
        expect(predicate.evaluate({ a: 1 })).toBe(false)
        expect(predicate.evaluate({ a: 2 })).toBe(false)
    })

    test('negative numbers', () => {
        const predicate = new Predicate("a < -1")
        expect(predicate.evaluate({ a: 0 })).toBe(false)
        expect(predicate.evaluate({ a: -1 })).toBe(false)
        expect(predicate.evaluate({ a: -2 })).toBe(true)
    })

    test('less than or equal to', () => {
        const predicate = new Predicate("a <= 1")
        expect(predicate.evaluate({ a: 0 })).toBe(true)
        expect(predicate.evaluate({ a: 1 })).toBe(true)
        expect(predicate.evaluate({ a: 2 })).toBe(false)
    })

    test('reversed condition', () => {
        const predicate = new Predicate("'X' == a")
        expect(predicate.evaluate({ a: 'X' })).toBe(true)
        expect(predicate.evaluate({ a: 'Y' })).toBe(false)
    })

    test('parameter equality', () => {
        const predicate = new Predicate("a == b")
        expect(predicate.evaluate({ a: 'X', b: 'Y' })).toBe(false)
        expect(predicate.evaluate({ a: 'Z', b: 'Z' })).toBe(true)
    })

    test('rejects on bad syntax', () => {
        expect(() => new Predicate("HELLO")).toThrow(PredicateParseError)
    })

    describe('LIKE', () => {
        const predicate = new Predicate("a LIKE 'HELLO%WORLD'")

        it('rejects when either argument is not a string', () => {
            expect(() => predicate.evaluate({ a: 0 })).toThrow(Error)
        })

        it('matches string patterns on evaluate', () => {
            expect(predicate.evaluate({ a: 'hello WORLD' })).toBe(true)
            expect(predicate.evaluate({ a: 'HELLO SIR' })).toBe(false)
        })

        it('converted to a contains fir prisma', () => {
            expect(predicate.toPrismaWhere()).toStrictEqual(
                {
                    a: { contains: 'HELLO%WORLD' }
                }
            )
        })
    })

    describe('supports decimals', () => {
        test('==', () => {
            const predicate = new Predicate("a == b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.2 })).toBe(false)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.1 })).toBe(true)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.2) })).toBe(false)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.1) })).toBe(true)
        })

        test('!=', () => {
            const predicate = new Predicate("a != b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.1 })).toBe(false)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.2) })).toBe(true)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.1) })).toBe(false)
        })

        test('>', () => {
            const predicate = new Predicate("a > b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.2), b: 3.2 })).toBe(false)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.3), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: 3.2, b: new Prisma.Decimal(3.2) })).toBe(false)
            expect(predicate.evaluate({ a: 3.3, b: new Prisma.Decimal(3.2) })).toBe(true)
        })

        test('>=', () => {
            const predicate = new Predicate("a >= b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.2 })).toBe(false)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.2), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.3), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.2) })).toBe(false)
            expect(predicate.evaluate({ a: 3.2, b: new Prisma.Decimal(3.2) })).toBe(true)
            expect(predicate.evaluate({ a: 3.3, b: new Prisma.Decimal(3.2) })).toBe(true)
        })

        test('<', () => {
            const predicate = new Predicate("a < b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.2), b: 3.2 })).toBe(false)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: 3.2, b: new Prisma.Decimal(3.2) })).toBe(false)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.2) })).toBe(true)
        })

        test('<=', () => {
            const predicate = new Predicate("a <= b")
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.3), b: 3.2 })).toBe(false)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.2), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: new Prisma.Decimal(3.1), b: 3.2 })).toBe(true)
            expect(predicate.evaluate({ a: 3.3, b: new Prisma.Decimal(3.2) })).toBe(false)
            expect(predicate.evaluate({ a: 3.2, b: new Prisma.Decimal(3.2) })).toBe(true)
            expect(predicate.evaluate({ a: 3.1, b: new Prisma.Decimal(3.2) })).toBe(true)
        })
    })


    it('filters transactions', () => {
        const predicate = new Predicate("externalId == 'some-external-id' AND type == 'some-type' AND name == 'some-name' AND description == 'some-description' AND amount > 2.49")
        expect(predicate.evaluate(EXAMPLE_TRANSACTION)).toBe(true)
        expect(predicate.evaluate({ ...EXAMPLE_TRANSACTION, name: 'some-other-name' })).toBe(false)
    })

    it('is case insensitive', () => {
        const predicate = new Predicate("name LIKE 'hello world'")
        expect(predicate.evaluate({ name: 'Hello World' })).toBe(true)
    })

    it('handles quotes', () => {
        const predicate = new Predicate("name == 'Gulliver\\'s Valley'")
        expect(predicate.evaluate({ name: 'Gulliver\'s Valley' })).toBe(true)
    })

    it('handles quote like', () => {
        const predicate = new Predicate("name LIKE 'Gulliver%s Valley'")
        expect(predicate.evaluate({ name: 'Gulliver\'s Valley' })).toBe(true)
        expect(predicate.evaluate({ name: 'GULLIVERS VALLEY' })).toBe(true)
    })

    it('handles like contains', () => {
        expect(new Predicate("name LIKE '%asos%'").evaluate({ name: 'Klarna*asos.com' })).toBe(true)
        expect(new Predicate("name LIKE '%MYDENTIST%'").evaluate({ name: '467 MYDENTIST CHESTERF' })).toBe(true)
    })
});