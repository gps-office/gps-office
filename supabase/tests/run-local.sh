#!/usr/bin/env bash
# Applies all migrations to a throwaway local Postgres database (with Supabase
# stand-ins) and runs the database tests. Needs psql and a local server.
#   PGHOST=/path/to/socket PGPORT=54329 PGUSER=postgres supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=gps_office_test
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run supabase/tests/supabase_stubs.sql
for f in supabase/migrations/*.sql; do echo "migrate: $f"; run "$f"; done
for f in supabase/tests/*_test.sql; do echo "test: $f"; run "$f"; done
echo "All database tests passed."
