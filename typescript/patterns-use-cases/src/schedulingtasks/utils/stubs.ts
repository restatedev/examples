export type StripeEvent = {
    type: string;
    created: number;
    data: {
        id: string;
        customer: string;
    };
}

export function sendReminderEmail(event: StripeEvent) {
    console.log(`Sending reminder email for event: ${event.data.id}`)
}

export function escalateToHuman(event: StripeEvent) {
    console.log(`Escalating to ${event.data.id} invoice to support team`)
}