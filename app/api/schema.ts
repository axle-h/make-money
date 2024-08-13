import {
    Account as DbAccount,
    Statement as DbStatement,
    Transaction as DbTransaction,
    Category as DbCategory,
    TransactionCategory as DbTransactionCategory,
    CategoryRule as DbCategoryRule,
    Prisma
} from '@prisma/client'
import {z} from "zod";
import {validatePredicate} from "@/app/api/predicate";

export class Schema {
    static readonly Boolean = z
        .union([z.boolean(), z.literal('true'), z.literal('false')])
        .transform((value) => value === true || value === 'true')

    static readonly PaginatedQuery = z.object({
        page: z.coerce.number().gt(0).default(1),
        limit: z.coerce.number().gt(0).default(10),
        orderByDescending: this.Boolean.optional()
    })

    static readonly NewAccount = z.object({
        bankName: z.string(),
        sortCode: z.string().optional(),
        accountNumber: z.string(),
        accountType: z.enum(['CURRENT_ACCOUNT', 'CREDIT_CARD'])
    }).refine(
        arg => !(arg.accountType === 'CURRENT_ACCOUNT' && !arg.sortCode),
        { message: 'Sort code is required for current accounts', path: ['sortCode'] }
    )
    .refine(
        arg => !(arg.accountType === 'CREDIT_CARD' && arg.sortCode),
        { message: 'Sort code is not allowed for credit cards', path: ['sortCode'] }
    )
    .refine(
        arg => !(arg.accountType === 'CURRENT_ACCOUNT' && !/\d{8}/.test(arg.accountNumber)),
        { message: 'Current account number must be 8 digits', path: ['accountNumber'] }
    )
    .refine(
        arg => !arg.sortCode || arg.accountType !== 'CURRENT_ACCOUNT' || /\d{6}/.test(arg.sortCode),
        { message: 'Sort code must be 6 digits', path: ['sortCode'] }
    )

    static readonly NewTransaction = z.object({
        externalId: z.string(),
        type: z.string(),
        date: z.coerce.date(),
        amount: z.string().regex(/-?\d+\.\d{2}/),
        name: z.string(),
        description: z.string()
    })

    static readonly NewStatement = z.object({
        dateUploaded: z.coerce.date(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        accountId: z.coerce.number().gt(0, 'Account is required'),
        transactions: z.array(this.NewTransaction)
            .min(1)
            .refine(transactions => {
                const references = new Set()
                for (let transaction of transactions) {
                    if (!references.add(transaction.externalId)) {
                        return false
                    }
                }
                return true
            }, 'duplicate transaction reference')
    })

    static readonly StatementQuery = this.PaginatedQuery.extend({
        accountId: z.coerce.number().gt(0).optional(),
        orderBy: z.enum(['dateUploaded', 'startDate', 'endDate', 'accountId']).optional()
    })

    private static readonly StringFilter = z.object({
        equals: z.string().optional(),
        contains: z.string().optional(),
        startsWith: z.string().optional(),
        endsWith: z.string().optional(),
        in: z.array(z.string()).optional(),
    }).optional()

    static readonly TransactionQuery = z.object({
        accountId: z.coerce.number().gt(0).optional(),
        statementId: z.coerce.number().gt(0).optional(),
        categoryId: z.coerce.number().gt(0).optional(),
        ruleId: z.coerce.number().gt(0).optional(),
        type: z.string().optional(),
        name: this.StringFilter,
        description: this.StringFilter,
        amount: z.object({
            gt: z.coerce.number().optional(),
            lt: z.coerce.number().optional()
        }).optional(),
        uncategorized: this.Boolean.optional()
    })

    static readonly UpdateTransactionRequest = z.object({
        notes: z.string().max(1000).optional(),
        categories: z.array(
            z.object({
                id: z.number().gt(0, 'Category is required'),
                fraction: z.number().gt(0).lte(1)
            })
        )
            .refine(
                cats => cats.length === 0 || cats
                    .map(cat => cat.fraction)
                    .reduce((x, y) => x + y) === 1,
                'category fractions must add up to 1'
            )
            .refine(
                cats => new Set(cats.map(cat => cat.id)).size === cats.length,
                'categories must be distinct'
            )
    })

    static readonly PaginatedTransactionQuery = this.PaginatedQuery.extend({
        ...this.TransactionQuery.shape,
        orderBy: z.enum(['externalId', 'type', 'date', 'amount', 'name', 'description', 'accountId']).optional(),
    })

    static readonly CategorizedTransactionQuery = z.object({
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
        subCategories: this.Boolean.default(false)
    })

    static readonly NewCategory = z.object({
        name: z.string(),
        emoji: z.string().optional(),
        report: this.Boolean,
        type: z.enum(['EXPENSE', 'BILL', 'INCOME', 'OTHER']),
        subCategory: this.Boolean
    })

    static readonly NewCategoryRule = z.object({
        name: z.string(),
        predicate: z.string().refine(validateTransactionPredicate, 'Must be a valid transaction predicate'),
        categoryId: z.coerce.number().gt(0, 'Category is required')
    })
}

export type NewAccount = z.infer<(typeof Schema)['NewAccount']>
export type AccountType = NewAccount['accountType']
export interface Account extends Omit<DbAccount, 'accountType'> {
    accountName: string
    accountType: AccountType,
    statementsFrom: Date | null,
    statementsTo: Date | null
}

export function accountNumber(account: Pick<Account, 'accountType' | 'accountNumber' | 'sortCode'>) {
    switch (account.accountType) {
        case 'CURRENT_ACCOUNT':
            return `${account.sortCode} ${account.accountNumber}`
        case 'CREDIT_CARD':
            return account.accountNumber
        default:
            throw new Error('unknown account type ' + account.accountType)
    }
}

export function accountName(account: Pick<Account, 'accountNumber' | 'bankName'>) {
    if (account.accountNumber.length > 8) {
        // credit cards
        return `${account.bankName} *${account.accountNumber.substring(account.accountNumber.length - 4)}`
    }

    return `${account.bankName} ${account.accountNumber}`
}

export function accountTypeName(accountType: AccountType) {
    switch (accountType) {
        case 'CURRENT_ACCOUNT':
            return 'Current account'
        case 'CREDIT_CARD':
            return 'Credit card'
        default:
            throw new Error('unknown account type ' + accountType)
    }
}

export interface Statement extends DbStatement {
    accountName: string
    accountType: AccountType
    transactionCount: number
}

export interface Transaction extends DbTransaction {
    categories: TransactionCategory[]
    accountName: string
    accountType: AccountType
}

export interface CategorizedTransaction {
    date: Date
    category: string
    emoji: string | null
    categoryType: CategoryType
    debit: Prisma.Decimal
    credit: Prisma.Decimal
}

export const EXAMPLE_TRANSACTION: DbTransaction = {
    id: 1,
    externalId: 'some-external-id',
    date: new Date(),
    type: 'some-type',
    name: 'some-name',
    description: 'some-description',
    statementId: 2,
    accountId: 3,
    amount: new Prisma.Decimal(2.50),
    notes: 'Some transaction notes'
}

export type NewStatement = z.infer<(typeof Schema)['NewStatement']>
export type StatementQuery = z.infer<(typeof Schema)['StatementQuery']>

export type NewTransaction = z.infer<(typeof Schema)['NewTransaction']>
export type PaginatedTransactionQuery = z.infer<(typeof Schema)['PaginatedTransactionQuery']>
export type TransactionQuery = z.infer<(typeof Schema)['TransactionQuery']>
export type CategorizedTransactionQuery = z.infer<(typeof Schema)['CategorizedTransactionQuery']>

export interface EntityLookup {
    id: number
    name: string
}

export interface TransactionMeta {
    types: string[]
    names: string[]
    descriptions: string[]
    accounts: EntityLookup[]
    statements: EntityLookup[]
    categories: EntityLookup[]
}

export type UpdateTransactionRequest = z.infer<(typeof Schema)['UpdateTransactionRequest']>

export type NewCategory = z.infer<(typeof Schema)['NewCategory']>
export type CategoryType = NewCategory['type']
export interface Category extends Omit<DbCategory, 'type'> {
    type: CategoryType
}
export interface CategoryStats extends Category {
    transactions: number
    totalDebits: Prisma.Decimal
    totalCredits: Prisma.Decimal
}
export type TransactionCategory = DbCategory & Pick<DbTransactionCategory, 'fraction'>


export function categoryTypeName(type: CategoryType) {
    switch (type) {
        case 'BILL':
            return 'Bill'
        case 'EXPENSE':
            return 'Expense'
        case 'INCOME':
            return 'Income'
        case 'OTHER':
            return 'Other'
        default:
            throw new Error('unknown category type ' + type)
    }
}

export interface CategoryRule extends DbCategoryRule {
    categoryName: string
}
export type NewCategoryRule = z.infer<(typeof Schema)['NewCategoryRule']>

export function validateTransactionPredicate(expression: string) {
    return validatePredicate(expression, EXAMPLE_TRANSACTION)
}