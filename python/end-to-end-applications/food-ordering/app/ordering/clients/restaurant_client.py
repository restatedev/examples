# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

import os
import requests

RESTAURANT_ENDPOINT = os.getenv("RESTAURANT_ENDPOINT", "http://localhost:5000")
RESTAURANT_TOKEN = os.getenv("RESTAURANT_TOKEN")


class RestaurantClient:
    def prepare(self, order_id: str) -> None:
        headers = {
            "Content-Type": "application/json",
        }
        if RESTAURANT_TOKEN:
            headers["Authorization"] = f"Bearer {RESTAURANT_TOKEN}"
        requests.post(
            f"{RESTAURANT_ENDPOINT}/prepare",
            json={"order_id": order_id},
            headers=headers,
        )
