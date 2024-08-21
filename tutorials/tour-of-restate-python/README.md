# Restate Example: Ticket reservation system Python

This example shows a subset of a ticket booking system.

Restate is a system for easily building resilient applications using **distributed durable building blocks**.

❓ Learn more about Restate from the [Restate documentation](https://docs.restate.dev).

## Running the example

To set up the example, use the following sequence of commands.

Setup the virtual env:

```shell
python3 -m venv .venv
source .venv/bin/activate
```

Install the requirements:

```shell
pip install -r requirements.txt
```

Start the app as follows:

```shell
python3 -m hypercorn tour/part4/app:app
```

Start the Restate Server ([other options here](https://docs.restate.dev/develop/local_dev)):

```shell
restate-server
```

Register the service:

```shell
restate dp register http://localhost:8000
```

Then add a ticket to Mary's cart:

```shell
curl localhost:8080/CartObject/Mary/addTicket -H 'content-type: application/json' -d '"seat2B"'
```

Let Mary buy the ticket via:
```shell
curl -X POST localhost:8080/CartObject/Mary/checkout
```

That's it! We managed to run the example, add a ticket to the user session cart, and buy it!
