# AdigunEplanAI backend

The authorized shared HephzibahBehulahHQ project is fqcbfnktdvqojyezxeis (EU). Only the adiguneplanai schema belongs to this product. Other product schemas and global Auth configuration must remain unchanged.

The exact SQL in schema/adiguneplanai.sql was applied through the connected migration tool as 20261103093742_adiguneplanai_private_projects. This is an applied SQL archive, not a CLI-generated migration. The official CLI could not create its configuration directory even after filesystem permission was granted. Do not replay this archive or reset the shared database.

projects stores owner-scoped native JSON snapshots with server timestamps and revision increments. Authenticated column grants prevent owner/revision forgery; RLS denies cross-owner access and anonymous sign-ins. Filter updates by the expected revision and treat zero updated rows as a conflict. The client must validate native projects before upload and after download; database envelope checks do not validate the entire engineering model. The six-MiB JSONB text bound allows normalized whitespace around the five-MiB native file limit.

Run tests/project-ownership.sql through an administrative SQL connection: all fixtures are transactionally rolled back. Verified owner insert/read/update and revision increment, denied owner reassignment, cross-owner read/update/delete isolation, and guest denial. No real user records are read by this test.

Still pending: custom schema Data API exposure, production redirect allowlist, frontend authentication/cloud saving, history/recovery, profiles and avatars. This backend foundation does not make the current local-only app cloud-connected. No privileged key belongs in browser code.
