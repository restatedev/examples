class EmailClient:

    def __init__(self):
        self.i = 0

    def notify_user_of_payment_success(self, user_id: str):
        print(f"Notifying user {user_id} of payment success")
        # send the email
        return True

    def notify_user_of_payment_failure(self, user_id: str):
        print(f"Notifying user {user_id} of payment failure")
        # send the email
        return True
