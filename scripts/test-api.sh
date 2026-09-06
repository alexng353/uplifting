#!/usr/bin/env bash
set -euo pipefail

# Requires local PostgreSQL binaries; uses a private socket without a TCP listener.
cd "$(dirname "$0")/.."
test_pg_dir=$(mktemp -d /tmp/uplifting-test-pg.XXXXXX)
cleanup() {
  if [[ -f "$test_pg_dir/data/postmaster.pid" ]]; then
    pg_ctl -D "$test_pg_dir/data" -m immediate -w stop >/dev/null
  fi
  rm -rf "$test_pg_dir"
}
trap cleanup EXIT

initdb -D "$test_pg_dir/data" -A trust --no-locale --encoding=UTF8 >/dev/null
pg_ctl -D "$test_pg_dir/data" -l "$test_pg_dir/server.log" \
  -o "-k $test_pg_dir -c listen_addresses=" -w start >/dev/null
UPLIFTING_TEST_PG_SOCKET="$test_pg_dir" bun test apps/api/tests
