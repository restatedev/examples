# Python Hello World

Python hello world project to get started.

## With [`uv`](https://docs.astral.sh/uv/)

To sync the dependencies:

```shell
uv sync
```

To start the project:

```shell
uv run -m hypercorn --config hypercorn-config.toml example:app
```

## With `pip`

To get started, create a venv and install the requirements file:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

To run:

```shell
python -m hypercorn --config hypercorn-config.toml example:app 
```

To build a docker image:

```shell
docker build .
```