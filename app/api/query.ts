export function stringifySearchParams(searchParams: any): URLSearchParams {
    return new URLSearchParams(flattenObject(searchParams))
}

export function flattenObject(searchParams: any): Record<string, string> {
    const result: Record<string, string> = {}
    const toVisit = Object.entries(searchParams)
    let current = toVisit.shift()
    while (current) {
        const [key, value] = current
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
                if (value instanceof Date) {
                    result[key] = value.toISOString()
                } else if (Array.isArray(value)) {
                    for (let [index, item] of value.entries()) {
                        toVisit.push([`${key}[${index}]`, item])
                    }
                } else {
                    for (let [subKey, subValue] of Object.entries(value)) {
                        toVisit.push([`${key}.${subKey}`, subValue])
                    }
                }
            } else {
                result[key] = value.toString()
            }
        }

        current = toVisit.shift()
    }
    return result
}

export function parseSearchParams(searchParams: URLSearchParams): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [keyPath, value] of searchParams) {
        let current = result

        const segments = keyPath.split('.')
            .flatMap(segment => {
                const arrMatch = segment.match(/^(.+)\[(\d+)]$/)
                if (arrMatch) {
                    const [, arrayKey, indexKey] = arrMatch
                    return [
                        { type: 'array', key: arrayKey },
                        { type: 'object', key: parseInt(indexKey) }
                    ]
                } else {
                    return [{ type: 'object', key: segment }]
                }
            })

        for (let [index, segment] of segments.entries()) {
            const isLast = index === segments.length - 1
            if (segment.key in current) {
                current = current[segment.key]
            } else {
                const next = isLast
                    ? value
                    : segment.type === 'array'
                        ? []
                        : {}
                current[segment.key] = next
                current = next
            }
        }
    }
    return result
}
