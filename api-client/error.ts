export class ApiError extends Error {
    constructor(actionName: string, readonly status: number, readonly statusText: string, readonly body: string) {
        super(`could not ${actionName} ${status} ${statusText}: ${body}`)
    }
}

export async function assertOk(response: Response, name: string) {
    if (!response.ok) {
        throw new ApiError(name, response.status, response.statusText, await response.text());
    }
}





