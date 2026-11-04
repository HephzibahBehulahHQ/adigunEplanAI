create schema adiguneplanai;
revoke all on schema adiguneplanai from public, anon;
grant usage on schema adiguneplanai to authenticated;
create table adiguneplanai.projects (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  native_project_id text not null check(length(native_project_id) between 1 and 128),
  payload jsonb not null,
  revision bigint not null default 1 check(revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, native_project_id),
  check(jsonb_typeof(payload) = 'object'),
  check(payload ? 'id' and payload->>'id' = native_project_id),
  check(octet_length(payload::text) <= 6291456)
);
alter table adiguneplanai.projects enable row level security;
revoke all on adiguneplanai.projects from public, anon, authenticated;
grant select, delete on adiguneplanai.projects to authenticated;
grant insert(native_project_id, payload) on adiguneplanai.projects to authenticated;
grant update(payload) on adiguneplanai.projects to authenticated;
create policy projects_owner on adiguneplanai.projects for all to authenticated
using ((select auth.uid()) = owner_id and coalesce((select auth.jwt())->>'is_anonymous','false') = 'false')
with check ((select auth.uid()) = owner_id and coalesce((select auth.jwt())->>'is_anonymous','false') = 'false');
create function adiguneplanai.advance_revision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function adiguneplanai.advance_revision() from public, anon, authenticated;
create trigger projects_revision before update on adiguneplanai.projects
for each row execute function adiguneplanai.advance_revision();
comment on table adiguneplanai.projects is 'AdigunEplanAI private native project snapshots; clients must validate payload and use revision filters for optimistic concurrency.';
