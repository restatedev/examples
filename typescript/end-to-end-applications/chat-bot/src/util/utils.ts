import { TerminalError } from "@restatedev/restate-sdk";

export function checkField<T>(spec: any, fieldName: string): T {
    const value = spec[fieldName];
    if (value === undefined || value === null) {
        throw new Error(`Missing field '${fieldName}'`);
    }
    return value as T;
}

export function checkActionField<T>(action: string, spec: any, fieldName: string): T {
    const value = spec[fieldName];
    if (value === undefined || value === null) {
        throw new Error(`Missing field ${fieldName} for action '${action}'`);
    }
    return value as T;
}

export function parseCurrency(text: string): number {
    if (typeof text === "number") {
        return text as number;
    }
    if (typeof text === "string") {
        text = text.trim().toLocaleLowerCase();
        const numString = text.split(" ")[0];
        return parseInt(numString);
    }
    throw new Error("Unknown type: " + typeof text);
}

export function httpResponseToError(statusCode: number, bodyText: string): Promise<never> {
    let errorMsg = `HTTP ${statusCode} - `;
    try {
        const errorBody = JSON.parse(bodyText);
        errorMsg += (errorBody as any).error.message;
    } catch (e) {
        errorMsg += bodyText;
    }

    // 429 Too Many Requests - typically a transient error
    // 5xx errors are server-side issues and are usually transient
    if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        throw new Error("Transient Error: " + errorMsg);
    }

    // Non-transient errors such as 400 Bad Request or 401 Unauthorized or 404 Not Found
    if (statusCode === 400 || statusCode === 401 || statusCode === 404) {
        throw new TerminalError(errorMsg);
    }

    // not classified - throw as retry-able for robustness
    throw new Error("Unclassified Error: " + errorMsg);
}

export function checkRethrowTerminalError(e: unknown): never {
    if (e instanceof ReferenceError) {
        // a bug in the code is terminal
        throw new TerminalError("Error in the code: " + e.message, { cause: e });
    }

    throw e;
}