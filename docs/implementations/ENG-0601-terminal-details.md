# ENG-0601 linked terminal details

Two new A3 sheets show enlarged body arrangements for the existing terminal devices: A3/020 contains X1, X2 and X3; A3/021 contains X4, X5 and XPE. All 17 views link to canonical A2 components; they do not add components or material quantities. Each view is an editable native panel-placement object and uses the sourced footprint at 5:1.

The project now has 29 sheets, with A4/022 through A4/028. Existing stable sheet IDs and electrical links are retained. The contents list has fifteen rows per column to accommodate the additional pages.

The strip order is a development proposal. These are enlarged body details, not completed terminal assemblies or panel drilling instructions. End covers, end clamps, rail products, rail capacity/bonding and conductor access space are not included. Cabinet rail locations and full installation verification remain outstanding. Views occupy separate sheets rather than compressing their labels into the enclosure overview.

Validation: 54 engineering workflow tests pass locally. Tests cover one view per canonical terminal, diagram bounds, non-overlapping bodies, unchanged 27 electrical nets, continuous numbering and native reopen. Browser tests render both sheets and move a linked view before save/reopen. Full checks and browser review pending.

## Release verification

PR112 merged as 032fe9239ee87406343750284e0e69fb1a765d2b. Final CI 43713770904/43713764983 passed; both detail-sheet screenshots in artifact 14161960035 were reviewed. Browser regression moves a terminal view and verifies exact objects, sheets and cross-sheet connections after local save/reopen. Full local checks passed.

Pages 43714090869 succeeded. Production build-info matches the merge. Executing the downloaded production engine confirms 29 sheets, A3/019–021, A4/022–028, 17 linked terminal views and 27 unchanged electrical nets after serialization. This is browser CI plus deployed-runtime verification, not an interactive production-browser session. The body details are not completed terminal assemblies; rails, covers/clamps, bonding and installation design remain outstanding. Overall goal active.
