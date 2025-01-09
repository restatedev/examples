import * as restate from "@restatedev/restate-sdk";

export type StripeEvent = {
    id: string; // event id
    type: string;
    created: number;
    data: {
        object: {
            id: string; // invoice id
            customer: string;
        };
    };
}

// Have a look at the scheduling tasks example (../schedulingtasks/payment_reminders.ts)
// to see a full implementation of this
const paymentTracker = restate.object({
    name: "PaymentTracker",
    handlers: {
        onPaymentFailed: async (ctx: restate.ObjectContext, event: StripeEvent) => {},
        onPaymentSuccess: async (ctx: restate.ObjectContext, event: StripeEvent) => {}
    }
})

export const PaymentTracker: typeof paymentTracker = {name: "PaymentTracker"};