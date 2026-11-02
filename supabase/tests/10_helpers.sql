-- Test-Helfer: Rollenwechsel (wie PostgREST: role + request.jwt.claims),
-- Ergebnis-Protokoll, ID-Verzeichnis.
drop schema if exists tests cascade;
create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create table tests.results (id serial primary key, name text not null, passed boolean not null, detail text);
create table tests.vars (k text primary key, v jsonb);
create table tests.ids (name text primary key, id uuid not null);
grant select, insert on tests.results to anon, authenticated;
grant usage on sequence tests.results_id_seq to anon, authenticated;
grant select, insert, update on tests.vars to anon, authenticated;
grant select on tests.ids to anon, authenticated;

create function tests.id(p_name text) returns uuid language sql stable as $$
  select id from tests.ids where name = p_name
$$;

create function tests.v(p_key text) returns jsonb language sql stable as $$
  select v from tests.vars where k = p_key
$$;

-- Standard-Belohnung eines Programms (an RLS vorbei, nur für die Testlogik)
create function tests.rid(p_prog text) returns uuid language sql stable security definer set search_path = public as $$
  select r.id from rewards r where r.program_id = tests.id(p_prog) and r.is_default
$$;

-- Simuliert, dass seit der letzten Buchung Zeit vergangen ist (30-s-Sperre)
create function tests.skip_cooldown() returns void language sql security definer set search_path = public as $$
  update transactions set created_at = created_at - interval '1 minute';
$$;

create function tests.act_as(p_user uuid) returns void language plpgsql as $$
begin
  if p_user is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', false);
    perform set_config('role', 'anon', false);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, false);
    perform set_config('role', 'authenticated', false);
  end if;
end $$;

create function tests.act_as_db() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', false);
  perform set_config('request.jwt.claims', '', false);
end $$;

create function tests.expect_error(p_name text, p_sql text, p_expected text) returns void language plpgsql as $$
declare v_err text;
begin
  begin
    execute p_sql;
  exception when others then
    v_err := sqlerrm;
  end;
  insert into tests.results (name, passed, detail)
  values (p_name, v_err is not null and position(p_expected in v_err) > 0,
          coalesce(v_err, 'kein Fehler, erwartet: ' || p_expected));
end $$;

create function tests.expect_ok(p_name text, p_sql text, p_save text default null) returns void language plpgsql as $$
declare v_res jsonb; v_err text;
begin
  begin
    execute p_sql into v_res;
  exception when others then
    v_err := sqlerrm;
  end;
  insert into tests.results (name, passed, detail)
  values (p_name, v_err is null, coalesce(v_err, left(coalesce(v_res::text, 'ok'), 300)));
  if p_save is not null and v_err is null then
    insert into tests.vars (k, v) values (p_save, v_res) on conflict (k) do update set v = excluded.v;
  end if;
end $$;

create function tests.expect_rows(p_name text, p_sql text, p_rows int) returns void language plpgsql as $$
declare v_n int; v_err text;
begin
  begin
    execute p_sql;
    get diagnostics v_n = row_count;
  exception when others then
    v_err := sqlerrm;
  end;
  insert into tests.results (name, passed, detail)
  values (p_name, v_err is null and v_n = p_rows, coalesce(v_err, 'Zeilen=' || v_n || ', erwartet=' || p_rows));
end $$;

create function tests.check(p_name text, p_sql text) returns void language plpgsql as $$
declare v boolean; v_err text;
begin
  begin
    execute p_sql into v;
  exception when others then
    v_err := sqlerrm;
  end;
  insert into tests.results (name, passed, detail)
  values (p_name, v_err is null and coalesce(v, false), coalesce(v_err, coalesce(v::text, 'null')));
end $$;
