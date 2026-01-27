_default:
    just --list docker

build:
    docker build -t uplifting-api .

run:
    docker run -p 8080:8080 uplifting-api

stop:
    docker stop uplifting-api

reset:
    docker compose down -v --remove-orphans