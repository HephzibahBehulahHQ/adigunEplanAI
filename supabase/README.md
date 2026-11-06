# AdigunEplanAI backend

The authorized shared HephzibahBehulahHQ project is fqcbfnktdvqojyezxeis (EU). Only the adiguneplanai schema belongs to this product. Other product schemas and global Auth configuration must remain unchanged.

The exact SQL in schema/adiguneplanai.sql was applied through the connected migration tool as 20261103093742_adiguneplanai_private_projects. This is an applied SQL archive, not a CLI-generated migration. The official CLI could not create its configuration directory even after filesystem permission was granted. Do not replay this archive or reset the shared database.

projects stores owner-scoped native JSON snapshots with server timestamps and revision increments. Authenticated column grants prevent owner/revision forgery; RLS denies cross-owner access and anonymous sign-ins. Filter updates by the expected revision and treat zero updated rows as a conflict. The client must validate native projects before upload and after download; database envelope checks do not validate the entire engineering model. The six-MiB JSONB text bound allows normalized whitespace around the five-MiB native file limit.

Run tests/project-ownership.sql through an administrative SQL connection: all fixtures are transactionally rolled back. Verified owner insert/read/update and revision increment, denied owner reassignment, cross-owner read/update/delete isolation, and guest denial. No real user records are read by this test.

Verified 2026-11-03: the Data API exposed-schema selection now includes adiguneplanai, retaining the five prior selections. Column grants and RLS remain unchanged. A publishable-key REST request using Accept-Profile: adiguneplanai returns HTTP 401 / 42501 (guest schema access denied). The existing production redirect allowlist already includes https://adiguneplanai.hephzibahbehulah.com/**; the shared Site URL remains unchanged.

Frontend verified accounts, profiles, owner-scoped local storage, explicit cloud saving/history/recovery and private avatars are implemented in the schema-17 increment. A legitimate authenticated production REST/storage round trip remains pending. No privileged key belongs in browser code.

## Native cloud transport

packages/project-storage/cloud.ts provides authenticated load/create/update transport for this schema. It validates the complete native model before sending, validates ownership/identity/revision on responses, and rejects account changes during requests. New snapshots use POST; existing snapshots require an explicit revision filter and reject zero-row updates as conflicts. It never automatically retries writes: a lost response may follow a successful server save, so callers must reload before deciding whether to retry. Redirects are rejected and server error bodies are not surfaced.

Five focused transport tests cover payload preservation, revision filters, conflicts, invalid models/responses, account changes and sanitized errors. These use an injected HTTP transport; they do not establish authenticated live REST or frontend integration. The account UI now uses this transport, with explicit writes and owner-scoped recovery.

## History and private avatars

Applied migration `20261106065156_adiguneplanai_revision_history_avatars` is archived in schema/adiguneplanai_history_avatars.sql. Client history access is SELECT-only and owner/nonanonymous restricted. A nonpublic fixed-search-path trigger archives project revisions; the archive was not replayed. The dedicated adiguneplanai-avatars bucket is private, accepts bounded PNG/JPEG/WebP files up to 2 MiB and restricts each owner to their own folder.

Read-only database inspection and unauthenticated 401 REST checks passed. The rollback fixture tests/history-avatars.sql did **not** execute: its mandatory tool confirmation expired. Do not describe this as a successful database isolation test or bypass the confirmation through another mutation interface. Actual authenticated production account/storage verification remains a release gate. Existing shared Auth settings and other product schemas/bucket policies remain unchanged.
