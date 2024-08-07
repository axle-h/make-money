import {
    PrismaClient,
    Prisma,
    Account as DbAccount,
    Statement as DbStatement,
    Transaction as DbTransaction,
    TransactionCategory as DbTransactionCategory,
    Category as DbCategory,
} from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import {Paginated, toPageArgs} from "@/app/api/paginated"
import {
    Account,
    NewAccount,
    NewStatement,
    Schema,
    Statement,
    StatementQuery,
    TransactionMeta,
    Transaction,
    PaginatedTransactionQuery,
    TransactionQuery,
    Category,
    UpdateTransactionRequest,
    NewCategory,
    CategoryStats,
    CategoryRule,
    NewCategoryRule,
    CategorizedTransactionQuery,
    CategorizedTransaction,
    accountName,
    CategoryType,
    AccountType, accountNumber
} from "@/app/api/schema"
import SortOrder = Prisma.SortOrder;
import {formatDateIso, formatDateLong} from "@/components/dates";
import {Predicate} from "@/app/api/predicate";
import {addDays, compareAsc, compareDesc} from "date-fns";

const prisma = new PrismaClient()

export class DbError extends Error {
    constructor(
        readonly message: string,
        readonly badRequest: boolean
    ) {
        super(message)
    }
}

export function tryHandleDbError(e: Error): DbError | null {
    if (e instanceof DbError) {
        return e
    }

    if (!(e instanceof PrismaClientKnownRequestError)) {
        return null
    }
    let badRequest = false
    // https://www.prisma.io/docs/orm/reference/error-reference#error-codes
    switch (e.code) {
        case 'P2000':
        case 'P2001':
        case 'P2002':
        case 'P2003':
        case 'P2004':
        case 'P2005':
        case 'P2006':
        case 'P2007':
            badRequest = true
            break
    }
    const message = e.message.split('\n')
            .map(line => line.trim())
            .findLast(line => line)
        || 'unknown error'
    return new DbError(`${e.code}: ${message}`, badRequest)
}

export class Accounts {
    private static readonly DEFAULT_INCLUDE: Prisma.AccountInclude = {
        statements: {
            orderBy: { endDate: 'desc' },
            take: 1
        }
    }

    async all(): Promise<Account[]> {
        const accounts = await prisma.account.findMany({
            include: Accounts.DEFAULT_INCLUDE
        })
        return accounts.map(Accounts.flattenAccount)
    }

    async create(request: NewAccount): Promise<Account> {
        const account = await prisma.account.create({
            include: Accounts.DEFAULT_INCLUDE,
            data: Schema.NewAccount.parse(request)
        })
        return Accounts.flattenAccount(account)
    }

    async delete(id: number) {
        return prisma.account.delete({ where: { id } })
    }

    private static flattenAccount({ statements, ...account }: DbAccount & { statements: DbStatement[] }): Account {
        return {
            ...account,
            accountName: accountNumber(account as Account),
            accountType: account.accountType as AccountType,
            statementsFrom: statements.length < 1
                ? null
                : statements.map(s => s.startDate)
                    .sort((a, b) => compareAsc(a, b))[0],
            statementsTo: statements.length < 1
                ? null
                : statements.map(s => s.endDate)
                    .sort((a, b) => compareDesc(a, b))[0]
        }
    }
}

export class Statements {
    async create(request: NewStatement): Promise<Statement> {
        const { transactions, accountId, ...newStatement } = Schema.NewStatement.parse(request)

        const statement = await prisma.statement.create({
            data: {
                ...newStatement,
                account: {
                    connect: {
                        id: accountId
                    }
                },
                transactions: {
                    connectOrCreate: transactions.map(transaction => ({
                        create: { ...transaction, accountId: accountId },
                        where: {
                            accountId_externalId: {
                                externalId: transaction.externalId,
                                accountId: accountId
                            },
                        }
                    })),
                }
            },
            include: { account: true }
        })

        return Statements.flattenStatement(statement, transactions.length)
    }

    async list(request: StatementQuery): Promise<Paginated<Statement>> {
        const { page, limit, ...args } = Schema.StatementQuery.parse(request)

        const where: Prisma.StatementWhereInput = {}
        const orderBy: Prisma.StatementOrderByWithRelationInput = {}

        if (args.accountId) {
            where.accountId = {
                equals: args.accountId
            }
        }

        if (args.orderBy) {
            orderBy[args.orderBy] = args.orderByDescending ? SortOrder.desc : SortOrder.asc
        }

        const pageArgs = toPageArgs({ page, limit })
        const dataPromise = prisma.statement.findMany({
            ...pageArgs,
            where,
            orderBy,
            include: {
                account: true,
                _count: { select: { transactions: true } },
            }
        })
        const count = await prisma.statement.count({ where })
        const statements = await dataPromise

        const data = statements
            .map(({ _count, ...statement }) => Statements.flattenStatement(statement, _count.transactions))

        return { page, limit, count, data }
    }

    private static flattenStatement({ account, ...statement }: DbStatement & { account: DbAccount }, transactionCount: number): Statement {
        return {
            ...statement,
            transactionCount,
            accountName: accountName(account as Account),
            accountType: account.accountType as AccountType,
        }
    }

    delete(id: number) {
        return prisma.statement.delete({ where: { id } })
    }
}

export class Transactions {
    async get(id: number): Promise<Transaction | null> {
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                categories: {
                    include: { category: true }
                },
                account: true
            }
        })
        if (!transaction) {
            return null
        }
        return this.flattenTransaction(transaction)
    }

    async list(request: PaginatedTransactionQuery): Promise<Paginated<Transaction>> {
        const { page, limit, ...query } = Schema.PaginatedTransactionQuery.parse(request)

        const where = await this.where(query)
        const orderBy: Prisma.TransactionOrderByWithRelationInput = {}

        if (query.orderBy) {
            orderBy[query.orderBy] = query.orderByDescending === true ? SortOrder.desc : SortOrder.asc
        }

        const pageArgs = toPageArgs({ page, limit })
        const dataPromise = prisma.transaction.findMany({
            ...pageArgs,
            where,
            orderBy,
            include: {
                categories: {
                    include: { category: true }
                },
                account: true
            }
        })
        const countPromise = prisma.transaction.count({ where })

        const [transactions, count] = await Promise.all([dataPromise, countPromise])

        // flatten out many:many categories
        const data = transactions.map(t => this.flattenTransaction(t))

        return { page, limit, count, data }
    }

    async listCategorized(request: CategorizedTransactionQuery): Promise<CategorizedTransaction[]> {
        const { dateFrom, dateTo, subCategories } = Schema.CategorizedTransactionQuery.parse(request)
        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: dateFrom,
                    // the query is assumed to be a date and inclusive of the entire day, so we have to go to tomorrow midnight
                    lt: !!dateTo ? addDays(dateTo, 1) : undefined
                },
            },
            include: {
                categories: {
                    include: { category: true }
                }
            }
        })
        const categorized = transactions
            .flatMap(({ date, amount, categories }) =>
                categories
                    .filter(category => category.category.report)
                    .map(category => {
                        let categoryName = category.category.name
                        if (!subCategories && category.category.subCategory) {
                            // strip sub category
                            const match = category.category.name.match(/(.*)\s+\(.+\)\s*$/)
                            if (match) {
                                categoryName = match[1]
                            }
                        }
                        return ({
                            date,
                            category: categoryName,
                            categoryType: category.category.type as CategoryType,
                            amount: amount.mul(category.fraction)
                        });
                    })
            )
            .reduce((agg, { date, amount, category, categoryType }) => {
                const key = `${category}:${formatDateIso(date)}`
                const prop: keyof CategorizedTransaction = amount.gte(0) ? 'credit' : 'debit'
                const other = key in agg
                    ? agg[key]
                    : agg[key] = {
                        date,
                        category,
                        categoryType,
                        debit: new Prisma.Decimal(0),
                        credit: new Prisma.Decimal(0)
                    }

                other[prop] = other[prop].plus(amount)
                return agg
            }, {} as Record<string, CategorizedTransaction>)

        return Object.entries(categorized)
            .map(([,v]) => v)
            .sort((a, b) => compareAsc(a.date, b.date))
    }

    async meta(request: TransactionQuery): Promise<TransactionMeta> {
        const where = await this.where(Schema.TransactionQuery.parse(request))

        // NOTE: not using prisma distinct as it does not actually call SELECT DISTINCT
        const transactions = await prisma.transaction.findMany({
            select: {
                type: true,
                name: true,
                description: true,
                statement: {
                    select: {
                        id: true,
                        dateUploaded: true
                    }
                },
                account: {
                    select: {
                        id: true,
                        bankName: true,
                        accountNumber: true
                    }
                },
                categories: {
                    select: {
                        category: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            where
        })

        const statements = transactions.map(({ statement, account }) => ({
            id: statement.id,
            name: `${formatDateLong(statement.dateUploaded)}, ${account.bankName} ${account.accountNumber}`
        }))

        const categories = transactions.flatMap(({ categories }) => categories).map(cat => cat.category)

        const accounts = transactions.map(({ account }) => ({
            id: account.id,
            name: `${account.bankName} ${account.accountNumber}`
        }))

        return {
            types: [...new Set(transactions.map(x => x.type))],
            names: [...new Set(transactions.map(x => x.name))],
            descriptions: [...new Set(transactions.map(x => x.description))],
            statements: [...new Map(statements.map(item => [item.id, item])).values()],
            categories: [...new Map(categories.map(item => [item.id, item])).values()],
            accounts: [...new Map(accounts.map(item => [item.id, item])).values()],
        }
    }

    async update(id: number, request: UpdateTransactionRequest): Promise<Transaction | null> {
        const { categories, notes } = Schema.UpdateTransactionRequest.parse(request)

        await prisma.transaction.update({ where: { id }, data: { notes } })

        await prisma.transactionCategory.deleteMany({ where: { transactionId: id } })

        const promises = categories.map(async category => {
            await prisma.transactionCategory.create({
                data : {
                    fraction: category.fraction,
                    category: {
                        connect: {
                            id: category.id
                        }
                    },
                    transaction: {
                        connect: { id }
                    }
                }
            })
        })
        await Promise.all(promises)

        return await this.get(id)
    }

    private flattenTransaction(
        { categories, account, ...transaction }: DbTransaction & {
            categories: (DbTransactionCategory & { category: DbCategory })[]
            account: DbAccount
        }): Transaction {
        return {
            ...transaction,
            categories: categories.flatMap(cat => ({
                ...cat.category,
                fraction: cat.fraction
            })),
            accountName: accountName(account as any),
            accountType: account.accountType as any
        }
    }

    private async where(query: TransactionQuery): Promise<Prisma.TransactionWhereInput> {
        let where: Prisma.TransactionWhereInput = {}

        if (query.ruleId) {
            const rule = await prisma.categoryRule.findUnique({ where: { id: query.ruleId } })
            if (rule) {
                const predicate = new Predicate(rule.predicate)
                where = predicate.toPrismaWhere()
            }
        }

        if (query.accountId) {
            where.accountId = { equals: query.accountId }
        }
        if (query.statementId) {
            where.statementId = { equals: query.statementId }
        }
        if (query.categoryId) {
            where.categories = {
                some: {
                    category: {
                        id: query.categoryId
                    }
                }
            }
        }
        if (query.type) {
            where.type = { equals: query.type }
        }
        if (query.name) {
            where.name = query.name
        }
        if (query.description) {
            where.description = query.description
        }
        if (query.amount) {
            where.amount = query.amount
        }
        if (query.uncategorized) {
            where.categories = { none: {} }
        }

        return where
    }
}

export class Categories {
    async list(): Promise<Category[]> {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
        return categories.map(({ type, ...category }) => ({
            ...category,
            type: type as CategoryType,
        }))
    }

    async stats(): Promise<CategoryStats[]> {
        const result = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                report: true,
                type: true,
                subCategory: true,
                transactions: {
                    select: {
                        transaction: {
                            select: {
                                amount: true
                            }
                        }
                    }
                }
            }
        })
        return result.map(({ transactions, type, ...category }) => ({
            ...category,
            type: type as CategoryType,
            transactions: transactions.length,
            totalDebits: transactions.filter(t => t.transaction.amount.lt(0))
                .map(t => t.transaction.amount).reduce((a, b) => a.add(b), new Prisma.Decimal(0)),
            totalCredits: transactions.filter(t => t.transaction.amount.gt(0))
                .map(t => t.transaction.amount).reduce((a, b) => a.add(b), new Prisma.Decimal(0))
        }))
    }

    async create(request: NewCategory): Promise<Category> {
        const { type, ...category } = await prisma.category.create({ data: Schema.NewCategory.parse(request) })
        return {
            ...category,
            type: type as CategoryType,
        }
    }

    async delete(id: number) {
        await prisma.category.delete({ where: { id } })
    }

    async update(id: number, request: NewCategory) {
        const { type, ...category } = await prisma.category.update({
            data: Schema.NewCategory.parse(request),
            where: { id }
        })
        return {
            ...category,
            type: type as CategoryType,
        }
    }
}

export class CategoryRules {
    async list(): Promise<CategoryRule[]> {
        const results = await prisma.categoryRule.findMany({ orderBy: { name: 'asc' }, include: { category: true } })
        return results.map(({ category, ...rule }) => ({
            ...rule,
            categoryName: category.name
        }))
    }

    async create(request: NewCategoryRule): Promise<CategoryRule> {
        const { category, ...rule } = await prisma.categoryRule.create({
            data: Schema.NewCategoryRule.parse(request),
            include: { category: true }
        })
        return {
            ...rule,
            categoryName: category.name
        }
    }

    async delete(id: number) {
        await prisma.categoryRule.delete({ where: { id } })
    }

    async update(id: number, request: NewCategoryRule): Promise<CategoryRule> {
        const { category, ...rule } = await prisma.categoryRule.update({
            data: Schema.NewCategoryRule.parse(request),
            include: { category: true },
            where: { id }
        })
        return {
            ...rule,
            categoryName: category.name
        }
    }

    async get(id: number) {
        const result = await prisma.categoryRule.findUnique({
            where: { id },
            include: { category: true }
        })
        if (!result ){
            return null
        }
        const { category, ...rule } = result
        return {
            ...rule,
            categoryName: category.name
        }
    }
}

export class Db {
    readonly accounts = new Accounts()
    readonly statements = new Statements()
    readonly transactions = new Transactions()
    readonly categories = new Categories()
    readonly rules = new CategoryRules()
}

export const db = new Db()