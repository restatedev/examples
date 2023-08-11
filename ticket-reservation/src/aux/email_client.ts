export class EmailClient {
  public static get() {
    return new EmailClient();
  }

  public notifyUserOfPaymentSuccess(userId: string): boolean {
    console.log(`Notifying user ${userId} of payment success`);
    // send the email
    return true;
  }

  public notifyUserOfPaymentFailure(userId: string): boolean {
    console.log(`Notifying user ${userId} of payment failure`);
    // send the email
    return true;
  }
}
