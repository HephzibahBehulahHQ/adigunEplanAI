begin;
insert into auth.users(id) values ('eccd6153-a344-482f-b678-915871ebca01'), ('eccd6153-a344-482f-b678-915871ebca02');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"eccd6153-a344-482f-b678-915871ebca01","role":"authenticated","is_anonymous":false}',true);
insert into adiguneplanai.projects(native_project_id,payload) values ('rls-test','{"id":"rls-test","name":"Owner A"}');
update adiguneplanai.projects set payload='{"id":"rls-test","name":"Updated"}' where native_project_id='rls-test' and revision=1;
do $$ begin
if (select revision from adiguneplanai.projects where native_project_id='rls-test') <> 2 then raise exception 'revision failed'; end if;
begin
update adiguneplanai.projects set owner_id='eccd6153-a344-482f-b678-915871ebca02';
raise exception 'owner transfer allowed';
exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"eccd6153-a344-482f-b678-915871ebca02","role":"authenticated","is_anonymous":false}',true);
do $$ declare n int; begin
if exists(select 1 from adiguneplanai.projects) then raise exception 'cross-owner read'; end if;
update adiguneplanai.projects set payload='{"id":"rls-test"}' where native_project_id='rls-test';
get diagnostics n = row_count;
if n <> 0 then raise exception 'cross-owner write'; end if;
delete from adiguneplanai.projects; get diagnostics n = row_count;
if n <> 0 then raise exception 'cross-owner delete'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"eccd6153-a344-482f-b678-915871ebca02","role":"authenticated","is_anonymous":true}',true);
do $$ begin
begin
insert into adiguneplanai.projects(native_project_id,payload) values ('guest','{"id":"guest"}');
raise exception 'anonymous sign-in write allowed';
exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
begin perform 1 from adiguneplanai.projects; raise exception 'guest access allowed';
exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'owner CRUD/revision, cross-owner isolation, ownership immutability and guest denial passed; test records rolled back' as result;
