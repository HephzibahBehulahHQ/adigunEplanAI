# AdigunEplanAI help

## Contents

- [Custom components](#custom-components)
- [Component revisions and replacement](#component-revisions-and-replacement)
- [Component files](#component-files)
- [Mechanical symbols](#mechanical-symbols)
- [Loading engineering symbols](#loading-engineering-symbols)

## Custom components

Create or open a project, then place a native symbol or create a custom symbol. Open Component library → Custom components. Enter your component name, manufacturer/organization, part number, category and description, then select the matching native symbol. These are your supplied declarations and remain marked **Unverified**.

Declare source/data rights and any available source or datasheet URL, source revision, ratings, mounting requirements and terminal information. Blank optional fields remain undeclared. Voltage uses V, current uses A and conductor section uses mm². Mechanical dimensions use mm: enter width, height and depth together or leave all three blank. These dimensions describe the physical part, independently of the schematic symbol body.

Create component saves the record in the native project. It does not automatically assign the component to a device or calculate equipment behavior. Choose a compatible device in the record's assignment form and select Assign part. Locked or hidden symbol layers cannot be assigned.

## Component revisions and replacement

Choose a component in Edit component revision, change its declarations and select Create next revision. Earlier records and device assignments remain unchanged. To replace a device's part, explicitly assign the desired revision to that compatible device. Undo/redo and native project saving include these changes.

Only the latest revision can be used as the base for another revision. Mapped symbol definitions are frozen to preserve the meaning of existing records. To change symbol geometry or connection points, create a new symbol definition and select it in the new component revision. Existing devices retain their original mapping.

## Component files

Export component downloads a .adcomponent.json file containing one revision and its native symbol definition. Import component reads that format into the current project, up to 1 MiB. No external datasheet is downloaded or redistributed.

Exact duplicate imports leave existing records intact. Conflicting record identities, revisions or local symbol edits are rejected; existing project work is preserved. Unsupported versions, unsafe source URLs, invalid geometry and attempts to import a verified status are rejected. Imported user declarations remain unverified. Component files are separate from complete native project exports.

## Mechanical symbols

Use Engineering symbols to search for and import Mechanical cable gland, then select it under Custom symbols and place it on the sheet. It receives an ME reference and has no electrical connection points, so wire tools cannot connect to its body. It can be moved, copied, deleted and included in a BOM through a matching user-supplied custom component. Its drawing does not declare physical dimensions or manufacturer ratings.

To create your own pinless mechanical drawing, open Custom symbols, select Mechanical symbol (no electrical connections), enter the body dimensions, leave Pins empty and optionally enter original artwork. Electrical custom symbols still require pins. Once a symbol is placed, its connection class cannot be changed; create a new definition instead. Mechanical custom-component records can use the pinless definition and follow the same revision/import/export workflow.

## Loading engineering symbols

Open Component library → Engineering symbols to load the symbol definitions. A loading message appears while that section downloads. Closing and reopening the section retains its search and category selection. Opening the library alone does not change the project.

If that download fails, the library shows an error while native editing and project export remain available. Save or export your work before reloading the page to try again. This does not guarantee that uncached assets are available offline.
