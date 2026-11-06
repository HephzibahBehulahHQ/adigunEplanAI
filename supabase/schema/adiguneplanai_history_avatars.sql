-- Applied SQL archive; use the recorded migration, do not replay on the shared HQ database.
create table adiguneplanai.project_history (
  owner_id uuid not null,
  native_project_id text not null,
  revision bigint not null check (revision > 0),
  payload jsonb not null,
  updated_at timestamptz not null,
  primary key (owner_id, native_project_id, revision),
  foreign key (owner_id, native_project_id)
    references adiguneplanai.projects(owner_id, native_project_id) on delete cascade,
  check (jsonb_typeof(payload) = 'object'),
  check (payload->>'id' = native_project_id),
  check (octet_length(payload::text) <= 6291456)
);
alter table adiguneplanai.project_history enable row level security;
revoke all on adiguneplanai.project_history from public, anon, authenticated;
grant select on adiguneplanai.project_history to authenticated;
create policy project_history_owner_read on adiguneplanai.project_history
for select to authenticated
using ((select auth.uid()) = owner_id and coalesce((select auth.jwt())->>'is_anonymous','false') = 'false');

-- Clients cannot insert/alter history. This trigger alone copies authorized project writes.
create function adiguneplanai.archive_project_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is distinct from new.owner_id
     or coalesce(auth.jwt()->>'is_anonymous','false') <> 'false' then
    raise exception 'Project history owner mismatch' using errcode = '42501';
  end if;
  insert into adiguneplanai.project_history(owner_id,native_project_id,revision,payload,updated_at)
    values (new.owner_id,new.native_project_id,new.revision,new.payload,new.updated_at);
  return new;
end;
$$;
revoke all on function adiguneplanai.archive_project_revision() from public, anon, authenticated;
create trigger projects_archive after insert or update on adiguneplanai.projects
for each row execute function adiguneplanai.archive_project_revision();
insert into adiguneplanai.project_history(owner_id,native_project_id,revision,payload,updated_at)
select owner_id,native_project_id,revision,payload,updated_at from adiguneplanai.projects
on conflict do nothing;
comment on table adiguneplanai.project_history is 'Immutable owner-only snapshots copied from successful AdigunEplanAI project writes; no authenticated direct mutation.';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('adiguneplanai-avatars','adiguneplanai-avatars',false,2097152,array['image/png','image/jpeg','image/webp']);
create policy adiguneplanai_avatar_read on storage.objects for select to authenticated
using (bucket_id='adiguneplanai-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy adiguneplanai_avatar_insert on storage.objects for insert to authenticated
with check (bucket_id='adiguneplanai-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy adiguneplanai_avatar_update on storage.objects for update to authenticated
using (bucket_id='adiguneplanai-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and coalesce((select auth.jwt())->>'is_anonymous','false')='false')
with check (bucket_id='adiguneplanai-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
create policy adiguneplanai_avatar_delete on storage.objects for delete to authenticated
using (bucket_id='adiguneplanai-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and coalesce((select auth.jwt())->>'is_anonymous','false')='false');
