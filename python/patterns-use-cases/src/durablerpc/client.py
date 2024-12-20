import argparse

import requests

RESTATE_URL = "http://localhost:8080"


# Durable RPC call to the product service
# Restate registers the request and makes sure it runs to completion exactly once
# Could be part of a Flask app or any other Python application
def reserve_product(product_id: str, reservation_id: str):
    url = f"{RESTATE_URL}/product/{product_id}/reserve"
    headers = {
        "idempotency-key": reservation_id,
        "Content-Type": "application/json"
    }
    response = requests.post(url, headers=headers)
    print({"reserved": response.json()})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("product_id", type=str, help="Product ID")
    parser.add_argument("reservation_id", type=str, help="Reservation ID")

    args = parser.parse_args()
    reserve_product(args.product_id, args.reservation_id)