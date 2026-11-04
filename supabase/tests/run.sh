#!/bin/bash
# Baut eine frische Testdatenbank (Supabase-Nachbildung + Schema + P18) und
# führt die Funktions- und Sicherheitstests aus. Voraussetzung: lokaler
# PostgreSQL-Server (16+), Benutzer postgres ohne Passwort, z. B.:
#   PGPORT=5432 supabase/tests/run.sh
# Danach optional: supabase/tests/concurrency.sh (echte Parallelität).
set -euo pipefail
export PGHOST=${PGHOST:-127.0.0.1} PGPORT=${PGPORT:-54329} PGUSER=${PGUSER:-postgres} PGOPTIONS='-c client_min_messages=warning'
D=$(cd "$(dirname "$0")" && pwd)
R=$(cd "$D/.." && pwd)
dropdb --if-exists mt && createdb mt
export PGDATABASE=mt
q() { psql -q -v ON_ERROR_STOP=1 "$@"; }
q -f $D/00_supabase_stub.sql
q -f $R/schema.sql
q -f $R/p18_platform.sql
q -f $R/p18_lockdown.sql
q -f $R/p18_hardening.sql
q -f $D/10_helpers.sql
q -f $D/20_seed.sql
# Backfill-Test: Profile löschen und Migration erneut laufen lassen
q -c "delete from business_profiles"
q -f $R/p18_platform.sql
q -f $D/30_tests.sql
psql -At -F ' | ' -c "select count(*) filter (where passed) || ' bestanden, ' || count(*) filter (where not passed) || ' fehlgeschlagen' from tests.results"
psql -At -F ' | ' -c "select 'FEHLER: ' || name, detail from tests.results where not passed order by id"
