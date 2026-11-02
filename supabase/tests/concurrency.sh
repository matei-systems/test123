#!/bin/bash
# Zwei Kassen gleichzeitig: Kasse 1 hält die Kartensperre 2 s, Kasse 2 startet
# 0,5 s später. Erwartet: genau eine Einlösung, die zweite scheitert sauber.
set -u
# Voraussetzung: supabase/tests/run.sh wurde vorher ausgeführt (Datenbank "mt" mit Testdaten).
export PGHOST=${PGHOST:-127.0.0.1} PGPORT=${PGPORT:-54329} PGUSER=${PGUSER:-postgres} PGDATABASE=mt PGOPTIONS='-c client_min_messages=warning'
D=$(cd "$(dirname "$0")" && pwd)
psql -q -At -c "update cards set stamps = 8 where id = tests.id('CA1')" >/dev/null
before=$(psql -At -c "select count(*) from reward_redemptions where card_id = tests.id('CA1')")
psql -q -At -c "select tests.act_as(tests.id('SA')); begin; select 'Kasse 1: ' || redeem_reward(tests.id('CA1'), tests.rid('PA'))::text; select pg_sleep(2); commit;" > ${TMPDIR:-/tmp}/matei-k1.out 2>&1 &
psql -q -At -c "select tests.act_as(tests.id('OA')); select pg_sleep(0.5); select 'Kasse 2: ' || redeem_reward(tests.id('CA1'), tests.rid('PA'))::text;" > ${TMPDIR:-/tmp}/matei-k2.out 2>&1 &
wait
grep -h "Kasse\|ERROR" ${TMPDIR:-/tmp}/matei-k1.out ${TMPDIR:-/tmp}/matei-k2.out | sed 's/^/  /' | cut -c1-140
after=$(psql -At -c "select count(*) from reward_redemptions where card_id = tests.id('CA1')")
stamps=$(psql -At -c "select stamps from cards where id = tests.id('CA1')")
echo "  Einlösungen vorher=$before nachher=$after, Stempel jetzt=$stamps"
[ $((after - before)) -eq 1 ] && [ "$stamps" -eq 0 ] && echo "  OK: genau eine Einlösung" || echo "  FEHLER: Doppel-Einlösung"

echo "--- Gleicher Einlöse-Code an zwei Kassen gleichzeitig"
psql -q -At -c "update cards set stamps = 8 where id = tests.id('CA1')" >/dev/null
tok=$(psql -q -At -c "select tests.act_as(tests.id('C1')); select create_redemption_request(tests.id('CA1'), tests.rid('PA'))->>'token';" | tail -1)
before=$(psql -At -c "select count(*) from reward_redemptions where card_id = tests.id('CA1')")
psql -q -At -c "select tests.act_as(tests.id('SA')); begin; select 'Kasse 1: ' || redeem_with_code('$tok')::text; select pg_sleep(2); commit;" > ${TMPDIR:-/tmp}/matei-k1.out 2>&1 &
psql -q -At -c "select tests.act_as(tests.id('OA')); select pg_sleep(0.5); select 'Kasse 2: ' || redeem_with_code('$tok')::text;" > ${TMPDIR:-/tmp}/matei-k2.out 2>&1 &
wait
grep -h "Kasse\|ERROR" ${TMPDIR:-/tmp}/matei-k1.out ${TMPDIR:-/tmp}/matei-k2.out | sed 's/^/  /' | cut -c1-140
after=$(psql -At -c "select count(*) from reward_redemptions where card_id = tests.id('CA1')")
echo "  Einlösungen vorher=$before nachher=$after"
[ $((after - before)) -eq 1 ] && echo "  OK: Code genau einmal eingelöst" || echo "  FEHLER"

echo "--- Zwei Stempel-Scans gleichzeitig (Doppel-Scan)"
psql -q -At -c "update cards set stamps = 2 where id = tests.id('CA1'); select tests.skip_cooldown();" >/dev/null
psql -q -At -c "select tests.act_as(tests.id('SA')); begin; select 'Kasse 1: ' || earn_on_card(tests.id('CA1'))::text; select pg_sleep(2); commit;" > ${TMPDIR:-/tmp}/matei-k1.out 2>&1 &
psql -q -At -c "select tests.act_as(tests.id('OA')); select pg_sleep(0.5); select 'Kasse 2: ' || earn_on_card(tests.id('CA1'))::text;" > ${TMPDIR:-/tmp}/matei-k2.out 2>&1 &
wait
grep -h "Kasse\|ERROR" ${TMPDIR:-/tmp}/matei-k1.out ${TMPDIR:-/tmp}/matei-k2.out | sed 's/^/  /' | cut -c1-140
stamps=$(psql -At -c "select stamps from cards where id = tests.id('CA1')")
[ "$stamps" -eq 3 ] && echo "  OK: nur ein Stempel (Saldo 3)" || echo "  FEHLER: Saldo $stamps"
