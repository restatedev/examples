# A Tour of Restate with Python

Restate is a system for easily building resilient applications, workflows, asynchronous tasks,
and event-driven applications.

This example contains the code for the `Tour of Restate` tutorial, for the Python API.
This tutorial takes your through key Restate features by developing an end-to-end ticketing app.


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
python3 -m hypercorn -b localhost:9080 tour/app/app:app
```

Start the Restate Server ([other options here](https://docs.restate.dev/develop/local_dev)):

```shell
restate-server
```

Register the service:

```shell
restate dp register http://localhost:9080
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
