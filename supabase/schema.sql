-- SpecSheet cloud schema. Tables are not directly accessible with the anon
-- key: RLS is enabled with no policies, and all access goes through the
-- security-definer functions below. Client links carry only the project uuid;
-- contractor operations additionally require the project's secret write_key.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  write_key uuid not null default gen_random_uuid(),
  data jsonb not null,
  catalog jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  picks jsonb not null,
  summary jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.submissions enable row level security;
revoke all on public.projects from anon, authenticated;
revoke all on public.submissions from anon, authenticated;

-- Contractor: publish (or republish) a project for client selection.
create or replace function public.share_project(
  p_data jsonb, p_catalog jsonb, p_id uuid default null, p_key uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_key uuid;
begin
  if p_id is null then
    insert into projects (data, catalog)
      values (p_data, p_catalog)
      returning id, write_key into v_id, v_key;
  else
    update projects set data = p_data, catalog = p_catalog, updated_at = now()
      where id = p_id and write_key = p_key
      returning id, write_key into v_id, v_key;
    if v_id is null then
      raise exception 'project not found or wrong key';
    end if;
  end if;
  return jsonb_build_object('id', v_id, 'write_key', v_key);
end $$;

-- Client: load the project behind a selection link (never exposes write_key).
create or replace function public.get_project(p_id uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object('id', id, 'data', data, 'catalog', catalog)
  from projects where id = p_id;
$$;

-- Client: record their selections.
create or replace function public.submit_selections(
  p_id uuid, p_picks jsonb, p_summary jsonb default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sid uuid;
begin
  if not exists (select 1 from projects where id = p_id) then
    raise exception 'project not found';
  end if;
  insert into submissions (project_id, picks, summary)
    values (p_id, p_picks, p_summary)
    returning id into v_sid;
  return v_sid;
end $$;

-- Contractor: read submissions (requires the write_key).
create or replace function public.get_submissions(p_id uuid, p_key uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', s.id, 'picks', s.picks, 'summary', s.summary, 'created_at', s.created_at)
      order by s.created_at
    ), '[]'::jsonb)
  from submissions s
  join projects p on p.id = s.project_id
  where p.id = p_id and p.write_key = p_key;
$$;

-- Contractor workspace: the source of truth for projects/catalog/settings.
-- One row per contractor "device group"; the (id, key) pair acts as the sync
-- code until real auth lands.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  key uuid not null default gen_random_uuid(),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;

create or replace function public.create_workspace()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_key uuid;
begin
  insert into workspaces default values returning id, key into v_id, v_key;
  return jsonb_build_object('id', v_id, 'key', v_key);
end $$;

create or replace function public.load_workspace(p_id uuid, p_key uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select state from workspaces where id = p_id and key = p_key;
$$;

create or replace function public.save_workspace(p_id uuid, p_key uuid, p_state jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update workspaces set state = p_state, updated_at = now()
    where id = p_id and key = p_key;
  if not found then
    raise exception 'workspace not found or wrong key';
  end if;
end $$;

grant execute on function public.create_workspace() to anon;
grant execute on function public.load_workspace(uuid, uuid) to anon;
grant execute on function public.save_workspace(uuid, uuid, jsonb) to anon;

grant execute on function public.share_project(jsonb, jsonb, uuid, uuid) to anon;
grant execute on function public.get_project(uuid) to anon;
grant execute on function public.submit_selections(uuid, jsonb, jsonb) to anon;
grant execute on function public.get_submissions(uuid, uuid) to anon;
