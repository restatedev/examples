FROM python:3.13.1-slim-bookworm

ENV PYTHONUNBUFFERED=True
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen --no-install-workspace

COPY . .
RUN uv sync --frozen

EXPOSE 9080

CMD ["/app/.venv/bin/python", "/app"]
