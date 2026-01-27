mod db
mod docker
_default:
    just --list

migrate:
    sqlx migrate run
    just prepare

# Generate sqlx offline query data for building without a live database
prepare:
    cargo sqlx prepare

build:
    cargo build --release

run:
    cargo run

dev:
    cargo watch -x run -i "openapi.json"
