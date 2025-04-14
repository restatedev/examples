import argparse
import logging
import httpx

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

RESTATE_URL = "http://localhost:8080"


# Durable RPC call to the product service
# Restate registers the request and makes sure it runs to completion exactly once
# Could be part of a Flask app or any other Python application
def reserve_product(product_id: str, reservation_id: str):
    response = httpx.post(f"{RESTATE_URL}/product/{product_id}/reserve", headers={
        "idempotency-key": reservation_id,
    })
    logging.info({"reserved": response.json()})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("product_id", type=str, help="Product ID")
    parser.add_argument("reservation_id", type=str, help="Reservation ID")

    args = parser.parse_args()
    reserve_product(args.product_id, args.reservation_id)
