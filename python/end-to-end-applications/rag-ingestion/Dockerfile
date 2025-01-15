FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 9080

ENV PYTHONPATH="/app/src"

CMD ["hypercorn", "-c" , "hypercorn-config.toml" , "main:app"]


