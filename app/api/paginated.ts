export interface Paginated<T> extends Required<PaginatedQuery> {
    data: T[]
    count: number
}

export interface PaginatedQuery {
    page?: number
    limit?: number
}

export function toPageArgs({ page, limit }: Required<PaginatedQuery>): { skip: number, take: number } {
    return {
        skip: (page - 1) * limit,
        take: limit
    }
}