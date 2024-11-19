

class PaymentClient:
    def charge(self, token, amount) -> bool:
        print(f"[{id}] Executing payment with token {token} for ${amount}")
        return True
