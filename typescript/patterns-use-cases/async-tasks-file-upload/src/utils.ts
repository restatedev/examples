export const Timeout = Symbol("Timeout");

export function withTimeout<T>(
    promise: Promise<T>,
    millis: number
): Promise<T | typeof Timeout> {
    const timeoutPromise = new Promise<typeof Timeout>((resolve) =>
        setTimeout(resolve, millis, Timeout)
    );
    return Promise.race([promise, timeoutPromise]);
}


export async function createS3Bucket(): Promise<URL> {
    const bucket = Number(Math.random() * 1_000_000_000).toString(16);
    return new URL(`https://s3-eu-central-1.amazonaws.com/${bucket}/`);
}

export async function uploadData(target: URL) {
    // simulate some work by delaying for a while. sometimes takes really long.
    return new Promise((resolve) =>
        setTimeout(resolve, Math.random() < 0.0 ? 1_500 : 10_000)
    );
}

export async function sendEmail(url: URL, email: string) {
    // send email
    console.log(` >>> Sending email to '${email}' with URL ${url}`);
}
