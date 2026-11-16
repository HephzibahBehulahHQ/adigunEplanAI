# Storage preservation — 2026-11-16
Application source was compared with GitHub main 02f43d72cba603c918969395400fcd39d543df26. No unpublished application implementation was found. Updated engineering progress/research/release notes are preserved at their docs paths.

Recovery scripts and root work logs are stored as four binary chunks recovery.zip.part0 through part3. Concatenate in numeric order to reconstruct recovery.zip (881802 bytes), then unzip. They are historical recovery material, not a deployment command.

local-runtime-checksum.bundle preserves the local-only codex/fix-pages-runtime-checksum commit 96699b5ba0a58fc3166da270eab934d57ffe8950. It requires base 3aea2d516c50ef37d374db8adda8186d5291c79e, preserved as codex/preserved-build-pages-2026-11-16. Fetch that branch, then fetch the bundle to restore the local branch. Bundle verified locally. Workbench history is also preserved as codex/preserved-workbench-2026-11-16.

Recent screenshots are included. Downloaded CI ZIP archives, duplicated extracted build/runtime trees, cached manufacturer downloads, dependency folders and generated build caches are not part of this source/recovery preservation; they are reproducible/downloadable material. Do not merge this preservation branch as an application release.

No local source files were deleted. node_modules was removed to free disk space after Git failed with no space left; restore with npm ci. Browser-only user projects and files outside this repository were not inspected or backed up.

## Latest unfinished research
UK 5 N compatibility with D-UK 4/10 is confirmed by Phoenix Contact's 2025-02-01 UK 5 N manufacturer PDF, pages 3 and 31, hosted at https://www.ilecsys.co.uk/sites/default/files/2025/02/01/phoenix-contact-3004362-en.pdf . Not yet implemented.
Rail candidate Phoenix Contact 0801733: NS 35/7.5 PERF 2000MM, galvanized/passivated steel, 35 mm width, 7.5 mm depth, 2000 mm stock length, 25 mm hole spacing, 15 × 6.2 mm slots. Source https://www.phoenixcontact.com/en-lt/products/din-rail-ns-35-75-perf-2000mm-0801733 . Manufacturer specifies 1.92 kA/1s, equivalent copper cross-section 16 mm²; this is not proof of complete installed PE/bonding suitability. Rail implementation, cut lengths, installation and assembly verification remain outstanding.
