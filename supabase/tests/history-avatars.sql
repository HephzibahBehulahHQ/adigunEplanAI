begin;
insert into auth.users(id) values ('1c862b38-8931-4813-9d7f-f4f246cba801'),('1c862b38-8931-4813-9d7f-f4f246cba802');
do $$ begin
if not exists(select 1 from storage.buckets where id='adiguneplanai-avatars' and public=false and file_size_limit=2097152) then raise exception 'private avatar configuration failed'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"1c862b38-8931-4813-9d7f-f4f246cba801","role":"authenticated","is_anonymous":false}',true);
insert into adiguneplanai.projects(native_project_id,payload) values ('history-test','{"id":"history-test","name":"first"}');
update adiguneplanai.projects set payload='{"id":"history-test","name":"second"}' where native_project_id='history-test' and revision=1;
insert into storage.objects(bucket_id,name) values ('adiguneplanai-avatars','1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png');
do $$ begin
if (select count(*) from adiguneplanai.project_history where native_project_id='history-test') <> 2 then raise exception 'revision count failed'; end if;
if (select payload->>'name' from adiguneplanai.project_history where native_project_id='history-test' and revision=1) <> 'first' then raise exception 'history overwritten'; end if;
if not exists(select 1 from storage.objects where bucket_id='adiguneplanai-avatars' and name='1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png') then raise exception 'owner avatar read failed'; end if;
begin
  update adiguneplanai.project_history set payload='{}' where native_project_id='history-test';
  raise exception 'history update allowed';
exception when insufficient_privilege then null; end;
begin
  delete from adiguneplanai.project_history where native_project_id='history-test';
  raise exception 'history delete allowed';
exception when insufficient_privilege then null; end;
begin
  insert into adiguneplanai.project_history(owner_id,native_project_id,revision,payload,updated_at)
  values ('1c862b38-8931-4813-9d7f-f4f246cba801','history-test',99,'{"id":"history-test"}',now());
  raise exception 'history fabrication allowed';
exception when insufficient_privilege then null; end;
begin
  update storage.objects set name='1c862b38-8931-4813-9d7f-f4f246cba802/stolen.png'
  where bucket_id='adiguneplanai-avatars' and name='1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png';
  raise exception 'avatar owner transfer allowed';
exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"1c862b38-8931-4813-9d7f-f4f246cba802","role":"authenticated","is_anonymous":false}',true);
do $$ declare n int; begin
if exists(select 1 from adiguneplanai.project_history where native_project_id='history-test') then raise exception 'cross-owner history leaked'; end if;
if exists(select 1 from storage.objects where bucket_id='adiguneplanai-avatars' and name='1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png') then raise exception 'cross-owner avatar leaked'; end if;
update storage.objects set metadata='{}' where bucket_id='adiguneplanai-avatars' and name='1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png';
get diagnostics n=row_count; if n<>0 then raise exception 'cross-owner avatar update allowed'; end if;
delete from storage.objects where bucket_id='adiguneplanai-avatars' and name='1c862b38-8931-4813-9d7f-f4f246cba801/avatar-test.png';
get diagnostics n=row_count; if n<>0 then raise exception 'cross-owner avatar delete allowed'; end if;
begin
insert into storage.objects(bucket_id,name) values ('adiguneplanai-avatars','1c862b38-8931-4813-9d7f-f4f246cba801/forged.png');
raise exception 'cross-owner avatar insertion allowed';
exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"1c862b38-8931-4813-9d7f-f4f246cba801","role":"authenticated","is_anonymous":true}',true);
do $$ begin
if exists(select 1 from adiguneplanai.project_history where native_project_id='history-test') then raise exception 'anonymous history leaked'; end if;
if exists(select 1 from storage.objects where bucket_id='adiguneplanai-avatars') then raise exception 'anonymous avatar leaked'; end if;
end $$;
set local role anon;
do $$ begin
begin perform 1 from adiguneplanai.project_history; raise exception 'guest history allowed';
exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: immutable revision history, owner-only avatar policies, owner transfer denial, cross-owner and anonymous isolation; all fixtures rolled back' as result;
