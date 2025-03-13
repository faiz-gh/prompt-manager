# Build Stage
FROM golang:1.20-alpine AS builder

# Install gcc and musl-dev for CGO support
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Build the binary with CGO enabled
RUN CGO_ENABLED=1 go build -o server .

# Final Stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
COPY data/ ./data/
EXPOSE 8080
CMD ["./server"]
