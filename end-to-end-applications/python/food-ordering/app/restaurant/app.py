# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate Examples for the Node.js/TypeScript SDK,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/blob/main/LICENSE
import asyncio

from flask import Flask, request, jsonify
import requests
import os
import time
from threading import Thread

# This file contains the logic for the Point of Sales API server of the restaurant.
# It responds to requests to create, cancel and prepare orders.

RESTATE_RUNTIME_ENDPOINT = os.getenv("RESTATE_RUNTIME_ENDPOINT", "http://localhost:8080")
RESTATE_TOKEN = os.getenv("RESTATE_RUNTIME_TOKEN")

app = Flask(__name__)


@app.route("/prepare", methods=["POST"])
def prepare_order():
    order_id = request.json["order_id"]
    print(f"{log_prefix()} Started preparation of order {order_id}; expected duration: 5 seconds", flush=True)
    response = jsonify({}), 200

    resolve_cb(order_id)
    return response


def resolve_cb(order_id):
    print(f"{log_prefix()} Order {order_id} prepared and ready for shipping", flush=True)
    headers = {
        "Content-Type": "application/json",
    }
    if RESTATE_TOKEN:
        headers["Authorization"] = f"Bearer {RESTATE_TOKEN}"
    requests.post(f"{RESTATE_RUNTIME_ENDPOINT}/order-workflow/{order_id}/finishedPreparation/send?delay=5s", headers=headers)


def log_prefix():
    return f"[restaurant] [{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] INFO:"