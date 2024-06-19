import {Prisma} from "@prisma/client";

export type ConditionalOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE';
export type LogicalOperator = 'AND' | 'OR';

export interface ConditionalNode {
    type: 'CONDITION'
    operator: ConditionalOperator
    left: ExpressionValue
    right: ExpressionValue
}

export interface Parameter {
    type: 'PARAMETER'
    name: string
}

export type Leaf = string | number | Prisma.Decimal | null

export interface Literal {
    type: 'LITERAL'
    value: Leaf
}

export type ExpressionValue = Parameter | Literal

export interface LogicalNode {
    type: 'LOGICAL';
    operator: LogicalOperator;
    left: PNode;
    right: PNode;
}

export type PNode = ConditionalNode | LogicalNode;

function parsePredicate(predicate: string): PNode {
    const tokens = predicate.match(/-?\d+|\w+|==|!=|>=|<=|>|<|LIKE|AND|OR|\(|\)|'(?:[^\\']|\\.)*'/g) as string[];
    let index = 0;

    function parseExpression(precedence = 0): PNode {
        let left = parseFactor();

        while (index < tokens.length) {
            const operator = tokens[index];

            const operatorPrecedence = getPrecedence(operator as LogicalOperator);
            if (operatorPrecedence <= precedence) break;

            index++;  // Skip the operator
            const right = parseExpression(operatorPrecedence);
            left = { type: 'LOGICAL', operator: operator as LogicalOperator, left, right };
        }

        return left;
    }

    function getPrecedence(operator: LogicalOperator): number {
        switch (operator) {
            case 'OR':
                return 1;
            case 'AND':
                return 2;
            default:
                return 0;
        }
    }

    function parseFactor(): PNode {
        if (tokens[index] === '(') {
            index++;  // Skip '('
            const expression = parseExpression();
            index++;  // Skip ')'
            return expression;
        } else {
            return parseCondition();
        }
    }


    function parseCondition(): ConditionalNode {
        const left = parseExpressionValue();
        const operator = tokens[index++] as ConditionalOperator;
        const right = parseExpressionValue();
        return { type: 'CONDITION', left, operator, right };
    }

    function parseExpressionValue(): ExpressionValue {
        const key = tokens[index++]
        const stringLiteral = key.match(/^'(.+)'$/)
        if (stringLiteral) {
            return { type: 'LITERAL', value: stringLiteral[1].replaceAll('\\\'', '\'') }
        }

        if (key === 'null') {
            return { type: 'LITERAL', value: null }
        }

        const numberLiteral = Number(key)
        if (!isNaN(numberLiteral)) {
            return { type: 'LITERAL', value: numberLiteral }
        }

        return { type: 'PARAMETER', name: key }
    }

    return parseExpression();
}



function evaluateSyntaxTree(node: PNode, obj: Record<string, Leaf>): boolean {
    function extractValue(ref: ExpressionValue): Leaf {
        switch (ref.type) {
            case "PARAMETER":
                if (!(ref.name in obj)) {
                    throw new Error(`${ref.name} is not a parameter`)
                }
                return obj[ref.name]
            case "LITERAL":
                return ref.value
            default:
                throw new Error(`Unsupported node type: ${(ref as ExpressionValue).type}`);
        }
    }

    switch (node.type) {
        case 'CONDITION': {
            const {left: leftExpression, operator, right: rightExpression} = node;
            const left = extractValue(leftExpression)
            const right = extractValue(rightExpression)

            function relational(
                fn: (left: string | number | Prisma.Decimal, right: string | number | Prisma.Decimal) => boolean,
                decimalFn: (left: Prisma.Decimal, right: string | number | Prisma.Decimal) => boolean,
                decimalFn2: (left: string | number | Prisma.Decimal, right: Prisma.Decimal) => boolean,
            ): boolean {
                if (left === null || right === null) {
                    return false
                }
                if (left instanceof Prisma.Decimal) {
                    return decimalFn(left, right)
                }
                if (right instanceof Prisma.Decimal) {
                    return decimalFn2(left, right)
                }
                return fn(left, right)
            }

            switch (operator) {
                case '==':
                    if (left === null && right === null) {
                        return true
                    }
                    return relational(
                        (l, r) => l === r,
                        (l, r) => l.eq(r),
                        (l, r) => r.eq(l),
                    )
                case '!=':
                    if ((left === null) !== (right === null)) {
                        return true
                    }
                    return relational(
                        (l, r) => l !== r,
                        (l, r) => !l.eq(r),
                        (l, r) => !r.eq(l),
                    )
                case ">":
                    return relational(
                        (l, r) => l > r,
                        (l, r) => l.gt(r),
                        (l, r) => !r.gte(l),
                    )
                case ">=":
                    return relational(
                        (l, r) => l >= r,
                        (l, r) => l.gte(r),
                        (l, r) => !r.gt(l),
                    )
                case "<":
                    return relational(
                        (l, r) => l < r,
                        (l, r) => l.lt(r),
                        (l, r) => !r.lte(l),
                        )
                case "<=":
                    return relational(
                        (l, r) => l <= r,
                        (l, r) => l.lte(r),
                        (l, r) => !r.lt(l),
                    )

                case "LIKE": {
                    if (typeof left !== 'string' || typeof right !== 'string') {
                        throw new Error('both arguments of LIKE expression must be a string')
                    }
                    const regex = new RegExp(escapeRegExp(right).replaceAll('%', '.*'), 'i')
                    return regex.test(left)
                }

                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        }
        case 'LOGICAL': {
            const {left, operator, right} = node;
            switch (operator) {
                case 'AND':
                    return evaluateSyntaxTree(left, obj) && evaluateSyntaxTree(right, obj);
                case 'OR':
                    return evaluateSyntaxTree(left, obj) || evaluateSyntaxTree(right, obj);
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        }
        default:
            throw new Error(`Unsupported node type: ${(node as PNode).type}`);
    }
}

function escapeRegExp(s: string) {
    // All of these should be escaped: \ ^ $ * + ? . ( ) | { } [ ]
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function toPrismaWhereCondition(node: PNode): Record<string, any> {
    switch (node.type) {
        case 'CONDITION': {
            const {left, operator, right} = node
            const parameter = [left, right].find(x => x.type === 'PARAMETER')
            const literal = [left, right].find(x => x.type === 'LITERAL')

            if (!parameter || !literal) {
                throw new Error(`expected one parameter and one literal but got ${left.type} and ${right.type}`)
            }

            const parameterName = (parameter as Parameter).name
            const literalValue = (literal as Literal).value

            switch (operator) {
                case '==':
                    return {[parameterName]: literalValue};
                case '!=':
                    return {[parameterName]: { not: literalValue }};
                case ">":
                    return {[parameterName]: { gt: literalValue }};
                case ">=":
                    return {[parameterName]: { gte: literalValue }};
                case "<":
                    return {[parameterName]: { lt: literalValue }};
                case "<=":
                    return {[parameterName]: { lte: literalValue }};
                case "LIKE":
                    return {[parameterName]: { contains: literalValue }};
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        }
        case 'LOGICAL': {
            const {left, operator, right} = node;
            switch (operator) {
                case 'AND':
                    return {AND: [toPrismaWhereCondition(left), toPrismaWhereCondition(right)]};
                case 'OR':
                    return {OR: [toPrismaWhereCondition(left), toPrismaWhereCondition(right)]};
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        }
        default:
            throw new Error(`Unsupported node type: ${(node as PNode).type}`);
    }
}

export class PredicateParseError extends Error {
    constructor(readonly expression: string) {
        super('cannot parse expression: ' + expression);
    }
}

export class Predicate {
    private readonly syntaxTree: PNode;

    constructor(readonly expression: string) {
        try {
            this.syntaxTree = parsePredicate(expression)
        } catch(e) {
            throw new PredicateParseError(expression)
        }

    }

    evaluate(obj: Record<string, any>): boolean {
        return evaluateSyntaxTree(this.syntaxTree, obj)
    }

    toPrismaWhere(): Record<string, any> {
        return toPrismaWhereCondition(this.syntaxTree)
    }
}

export function validatePredicate(expression: string, obj: Record<string, any>) {
    try {
        const predicate = new Predicate(expression)
        predicate.evaluate(obj)
        predicate.toPrismaWhere()
        return true
    } catch (e) {
        return false
    }
}