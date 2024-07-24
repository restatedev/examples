class PaymentClient:

    def __init__(self):
        self.i = 0

    async def call(self, idempotency_key: str, amount: float) -> bool:
        print(f"Payment call succeeded for idempotency key {idempotency_key} and amount {amount}")
        # do the call
        return True

    async def failing_call(self, idempotency_key: str, amount: float) -> bool:
        if self.i >= 2:
            print(f"Payment call succeeded for idempotency key {idempotency_key} and amount {amount}")
            i = 0
            return True
        else:
            print(f"Payment call failed for idempotency key {idempotency_key} and amount {amount}. Retrying...")
            self.i += 1
            raise Exception("Payment call failed")