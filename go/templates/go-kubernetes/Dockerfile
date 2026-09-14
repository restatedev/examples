FROM golang:1.25 AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /service .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /service /service
ENTRYPOINT ["/service"]
