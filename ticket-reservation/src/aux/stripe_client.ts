export class StripeClient {
  public static get() {
    return new StripeClient();
  }

  public call(idempotencyKey: string, amount: number): boolean {
    console.log(
      `Executing stripe call for idempotency key ${idempotencyKey} and amount ${amount}`,
    );
    // do the call
    return true;
  }
}
