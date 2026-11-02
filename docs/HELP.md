# AdigunEplanAI help

## Contents

- [Custom components](#custom-components)
- [Component revisions and replacement](#component-revisions-and-replacement)
- [Component files](#component-files)

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
