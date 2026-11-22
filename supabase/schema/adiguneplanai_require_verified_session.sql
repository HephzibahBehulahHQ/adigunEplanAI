-- Keep the existing owner rules and add product-session verification.
create policy adiguneplanai_verified_project_session on adiguneplanai.projects
as restrictive for all to authenticated
using ((select adiguneplanai_private.has_verified_session()))
with check ((select adiguneplanai_private.has_verified_session()));

create policy adiguneplanai_verified_project_history_session on adiguneplanai.project_history
as restrictive for all to authenticated
using ((select adiguneplanai_private.has_verified_session()))
with check ((select adiguneplanai_private.has_verified_session()));

create policy adiguneplanai_verified_avatar_session on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'adiguneplanai-avatars' or (select adiguneplanai_private.has_verified_session()))
with check (bucket_id <> 'adiguneplanai-avatars' or (select adiguneplanai_private.has_verified_session()));
