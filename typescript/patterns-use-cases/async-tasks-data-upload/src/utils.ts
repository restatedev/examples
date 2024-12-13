
export function withTimeout<T>(promise: Promise<T>, millis: number): Promise<T> {
    let timeoutPid: NodeJS.Timeout;
    const timeout = new Promise((_resolve, reject) =>
        timeoutPid = setTimeout(() => reject(`Timed out after ${millis} ms.`), millis));

    return Promise.race([promise,timeout])
        .finally(() => {
            if (timeoutPid) {
                clearTimeout(timeoutPid);
            }
        }) as Promise<T>;
}


export async function createS3Bucket(): Promise<URL> {
    const bucket = Number(Math.random() * 1_000_000_000).toString(16);
    const bucketUrl = `https://s3-eu-central-1.amazonaws.com/${bucket}/`
    console.info(` >>> Creating bucket with URL ${bucketUrl}`);
    return new URL(bucketUrl);
}

export async function uploadData(target: URL) {
    const timeRemaining = Math.random() < 0.5 ? 1_500 : 10_000
    console.info(` >>> Uploading data to target ${target}. ETA: ${timeRemaining}ms`);
    // simulate some work by delaying for a while. sometimes takes really long.
    return new Promise((resolve) =>
        setTimeout(resolve, timeRemaining)
    );
}

export async function sendEmail(url: URL, email: string) {
    console.info(` >>> Sending email to '${email}' with URL ${url}`);
}
