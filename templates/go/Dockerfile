FROM golang:1.22-bookworm as builder

WORKDIR /app

COPY go.* ./
RUN go mod download
COPY . ./

RUN CGO_ENABLED=0 go build -v -o server

FROM alpine
COPY --from=builder /app/server /app/server

CMD ["/app/server"]
