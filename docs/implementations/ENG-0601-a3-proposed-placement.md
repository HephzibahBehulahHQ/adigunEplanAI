# ENG-0601 proposed A3 device placement — local increment

Fresh examples now contain linked F1 and K1 panel-placement views on existing A3/019, at 1:2 scale and proposed centres (220,240) and (300,240). Geometry derives from existing manufacturer body-envelope records. Both views are inside the 545 × 775 mm plate outline, do not overlap, and resolve to the canonical A2 device instances; no duplicated BOM quantities. Positioning is proposed, not certified mounting/drill coordinates. Rails, ducts, clearances, remaining devices, thermal design and bonding still require work.

50 focused tests pass, including plate boundaries, spacing, canonical rename, BOM identity and save/reopen. Existing manual placement browser test now removes seeded views from its imported fixture so it still exercises actual creation; a separate default-layout browser test captures the proposed layout and checks save/reopen. Browser verification not yet run.

Full check session 53642 is running, log work/a3-placement-check.log. Current remote main 8deac09dc6e11c682b765505e02050627549c739 (PR107). New changes are local only: engine mirrors, focused/browser tests and this note. Publish only those selected files after checks. Inspect screenshot eng0601-a3-proposed-layout.png before merge. Do not claim complete A3 assembly or installation approval.
