_default:
    @just --list

# ─── Dev ──────────────────────────────────────────────

# Start all services (api + mobile) in parallel
dev:
    just dev-api & just dev-mobile & wait

# Start only the API (Rust, cargo watch)
dev-api:
    cd api && just dev

# Start only the mobile app (Bun + Vite)
dev-mobile:
    cd mobile && just dev

# ─── Build ────────────────────────────────────────────

# Build all projects
build: build-api build-mobile

# Build the API (release)
build-api:
    cd api && just build

# Build the mobile app
build-mobile:
    cd mobile && just build

# ─── Test ─────────────────────────────────────────────

# Run all tests
test: test-mobile-unit

# Run mobile unit tests
test-mobile-unit:
    cd mobile && just test-unit

# Run mobile E2E tests
test-mobile-e2e:
    cd mobile && just test-e2e

# ─── Check ───────────────────────────────────────────

# Check all projects (lint + build)
check: check-mobile

# Check the mobile app (lint + build)
check-mobile:
    cd mobile && bun run lint && bun run build

# ─── Lint & Format ───────────────────────────────────

# Lint all projects
lint: lint-api lint-mobile

# Lint the API (cargo clippy)
lint-api:
    cd api && cargo clippy -- -D warnings

# Format the API (cargo fmt)
fmt-api:
    cd api && cargo fmt

# Check API formatting
fmt-api-check:
    cd api && cargo fmt -- --check

# Lint + format the mobile app (biome)
lint-mobile:
    cd mobile && just lint

# ─── Database ─────────────────────────────────────────

# Start the database
db-start:
    cd api && just db start

# Stop the database
db-stop:
    cd api && just db stop

# Reset the database (destroys data)
db-reset:
    cd api && just db reset

# Run database migrations
migrate:
    cd api && just migrate

# ─── Docker ───────────────────────────────────────────

# Build the API Docker image
docker-build:
    cd api && just docker build

# Run the API Docker container
docker-run:
    cd api && just docker run

# Stop the API Docker container
docker-stop:
    cd api && just docker stop

# ─── Setup ────────────────────────────────────────────

# Install all dependencies
install: install-mobile
    @echo "Rust dependencies are managed by cargo automatically."

# Install mobile dependencies
install-mobile:
    cd mobile && just install

# Full setup: install deps, start db, run migrations
setup: install db-start migrate
    @echo "Setup complete. Run 'just dev' to start developing."

# ─── Clean ────────────────────────────────────────────

# Clean all build artifacts
clean: clean-api clean-mobile

# Clean API build artifacts
clean-api:
    cd api && cargo clean

# Clean mobile build artifacts
clean-mobile:
    rm -rf mobile/dist mobile/node_modules/.vite
