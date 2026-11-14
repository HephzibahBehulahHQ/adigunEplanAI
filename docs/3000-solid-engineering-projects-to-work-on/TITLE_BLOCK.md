# Mandatory editable drawing title block

## Placement and scope

Every drawing/document sheet must have a project title block **inside the drawing canvas at the bottom-right of the sheet frame**. This is the engineering drawing title block, not the application header, a floating window or a browser title bar.

Apply this template to every section of every catalog project: A1, A2, A3, A4, and all future user-created sections such as A5/A6. Existing project briefs inherit this requirement through NEXT_AGENT.md. Adding a section or sheet must not omit its title block.

Anchor to the sheet's coordinates and right/bottom margins, not the viewport. Preserve placement when zooming, panning, changing paper size/orientation, saving, reopening or exporting. Reserve its footprint so drawing content, grid coordinates and continuation labels do not overlap it. Keep the approved application layout unchanged.

## Only two fixed identities

Render the following fixed, non-editable identity texts in every title block:

- **Hephzibah Behulah** — corporate/trademark identity.
- **AdigunEplanAI** — software name.

Do not expose these two identities as editable project fields or allow imported metadata to replace them. Resolve their display from the authoritative branding/configuration. Do not invent registered-trademark symbols, approvals, certifications or logos.

Every other project/title-block information value is user-editable. Optional division, contractor or customer details are not additional locked fields. Keep drawing metadata separate from the application's fixed header branding.

## Editable information

| Information | Scope | Required behaviour |
| --- | --- | --- |
| Project title | Project | User can edit; propagate to all sheets in that project. |
| Project/job number | Project | Editable reference, separate from immutable internal project ID. |
| Project manager | Project | Editable person's name/role; do not invent a manager. |
| Client/customer | Project | Editable organisation/name. |
| Installation/site/location | Project | Editable address, building or plant designation. |
| Designer/drawn by | Project default with sheet override | Editable name or initials. |
| Checked by | Project default with sheet override | Editable; blank is valid until actually checked. |
| Approved by | Project default with sheet override | Editable; a name does not prove approval or create a signature. |
| Creation/drawing date | Project default with sheet override | Editable date with an unambiguous displayed format. |
| Revision and revision date | Sheet | Editable, saved with the sheet; retain relevant revision history. |
| Drawing/document number | Sheet | Editable external reference, separate from internal sheet identity. |
| Sheet title/description | Sheet | Editable; synchronise the custom name with the sidebar. |
| Section/sheet reference | Sheet | Reflect current section/name, e.g. A1/Power; changing it uses the actual sheet rename/move controls and updates cross-references. |
| Drawing scale | Sheet | Editable through the drawing's actual scale setting; not a disconnected decorative value. |
| Paper size and orientation | Sheet | Editable through actual sheet settings; title-block placement must follow the resulting sheet dimensions. |
| Notes or issue status | Project default with sheet override | Editable; never imply as-built/reviewed status without evidence. |

Expose values through the existing properties/sidebar area or direct on-canvas field editing. A user should be able to select the block or double-click an editable value and edit it without opening a large new screen. Use the existing inspector and editing patterns. The two fixed identities remain protected while every other information value can be changed directly or through its underlying sheet/project setting.

## Persistence and behaviour

Store shared information once on the project, and sheet-specific values/overrides on immutable sheet IDs. Updating a project title or manager must update every sheet using that shared value without changing unrelated projects. Renaming/reordering a sheet must not detach its title block, change its immutable ID, or break electrical continuity. Show current names/numbers in both the drawing and its cross-references.

Save/reopen, native import/export and supported drawing/print exports must retain the title-block information and bottom-right placement. Closing a canvas tab must preserve its sheet and title-block data. A copied sheet keeps shared project metadata and receives its own sheet identity and editable sheet details.

## Acceptance checks for implementation

1. Create a project, add sheets under A1 and A2, then add a future A5 section and a sheet. Every selected sheet shows the title block at the bottom-right inside its frame.
2. Edit project title, manager, customer and site through existing editing surfaces. Verify propagation to the project's other sheets and isolation from another project.
3. Edit sheet title, drawing number, revision, date and notes. Verify these affect the correct sheet; rename/move/reorder without breaking continuation references.
4. Attempt to edit/override the two fixed identities, including via imported metadata. They remain Hephzibah Behulah and AdigunEplanAI.
5. Change paper size/orientation, pan and zoom. Verify title-block anchoring, legibility, bounds and absence of overlaps. Do not claim a scale/paper setting changed unless the actual drawing setting changed.
6. Save/reopen, close/reopen the canvas tab, and inspect native and supported printed/vector exports. Verify information, branding and placement survive.

## Main-repository evidence and current gap

- docs/MASTER_SPECIFICATION.md, central schematic workspace: drawing frames and title blocks are required; this owner instruction specifies placement, editability and fixed identities.
- product.config.json: product.name is AdigunEplanAI.
- packages/design-tokens/corporate.json: corporate name is Hephzibah Behulah.
- apps/web/src/DrawingSheetFrame.tsx: a rendered frame/footer exists, showing project/document/page/paper information; its parent group uses pointerEvents="none" and is not the required editable bottom-right block.
- apps/web/index.html, customSheetFrame: the published-runtime source contains a simple footer with sheet name/number and branding. It must not be described as fulfilling the full editable project-manager/title-block requirement.

This document specifies the required implementation. Adding it to the catalog does not itself implement the canvas editing controls. The next agent must implement and verify the checks above using the existing runtime and approved interface.
