# Workspace controls

View shows or hides each panel. A panel heading collapses its contents; its × button hides it. Expand Layout within a panel to choose the left, right or bottom dock and change its size. The size slider supports arrow keys. Reset layout restores the default panel positions, visibility and sizes while preserving theme and language.

Settings changes light/dark theme, interface language and white/dark/custom drawing background. Browser-local interface preferences survive reloads. These controls do not change engineering data. Help opens a keyboard-accessible guide; Escape closes it. On narrow screens the drawing comes first and panels stack below it. No project, engineering checks, cloud session or assistant is claimed before those milestones are implemented.

## Native projects

New project creates a versioned native document with an A3 drawing page. The project navigator switches between local projects. Properties renames the active project and sets each document's output language independently of the interface language. New drawing page adds a native sheet; drawing tabs switch the visible sheet. Undo/Redo restores supported project edits. Save locally retries browser storage; the status bar shows whether current work is saved.

Export project downloads native JSON. Import project validates schema and references before changing state; replacing an existing project ID requires confirmation. Malformed or unsupported files preserve existing work. If local storage is unreadable, Download recovery data preserves its raw contents; Reset project storage requires confirmation. If saving fails, keep the tab open and export your work. Browser-local projects do not sync to cloud services.

## Drawing tools

Home contains the implemented project/save/import/export and undo/redo actions. View contains panel visibility and layout reset controls. Choose a symbol from Symbols, then click the drawing to place it. Select supports click, Shift-click and area selection; drag or arrow keys move selected symbols. Rotate, Mirror, Align, Group and Ungroup change the native geometry. Copy/Paste uses an internal native clipboard across drawing tabs, preserving internal wires. Delete removes selected symbols and their connected wires; Undo restores them.

Wire mode connects two labelled pins. Choose Junction and click an existing wire to split it into a real shared-terminal connection. Lines that merely cross are not joined. Net label attaches stored label data to a chosen pin. The Properties sidebar edits the selected device reference, position and terminal designations. Layer controls select placement layers and toggle visibility/locking. Fit page, zoom and Pan control the view. Page size/orientation changes preserve existing objects and reject a page that cannot contain them.

Keyboard: arrows move selection; R rotates; Delete removes; Ctrl/Cmd+C/V copies/pastes; Ctrl/Cmd+X cuts; Ctrl/Cmd+D duplicates; Ctrl/Cmd+Z undoes; Ctrl/Cmd+Y or Shift+Ctrl/Cmd+Z redoes. Escape leaves wiring/label mode. Text inputs retain ordinary text-editing behavior.
