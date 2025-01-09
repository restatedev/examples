export type StripeEvent = {
    type: string;
    created: number;
    data: {
        object: {
            id: string;
            customer: string;
        };
    };
}

export function sendEmail(message: string) {
    console.log(`Sending email: ${message}`);
}