# Build stage
FROM rust:1.83-bookworm AS builder

WORKDIR /app

# Copy manifests first for dependency caching
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy the actual source code and SQLx cache
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx

# Touch main.rs to invalidate the dummy build
RUN touch src/main.rs

# Build with SQLx offline mode (requires .sqlx directory with query metadata)
# Run `cargo sqlx prepare` locally before building the Docker image
RUN SQLX_OFFLINE=true cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/api /app/api

# Copy migrations (embedded in binary via sqlx::migrate!, but kept for reference)
COPY migrations ./migrations

ENV PORT=8080
EXPOSE 8080

CMD ["./api"]
