_default:
    just --list db

start:
    docker compose up -d
stop:
    docker compose down
reset:
    docker compose down -v --remove-orphans