FROM golang:1.24-alpine as builder

WORKDIR /app

COPY src/ .
RUN apk add --no-cache git
RUN go mod tidy
RUN go build -o wuzapi .

FROM alpine:latest

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/wuzapi .
# Create necessary directories
RUN mkdir -p /app/data /app/files /app/sessions

CMD ["./wuzapi"]
