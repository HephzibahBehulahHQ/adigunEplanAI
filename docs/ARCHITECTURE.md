# Architecture decision: Milestone 0

Status: proposed baseline for Milestone 1; no application implemented.

Use a TypeScript workspace with apps/web (React/Vite), apps/api (server-side product services), packages/project-model, packages/geometry, packages/connectivity, packages/calculations, packages/ui, and packages/locales. Keep domain modules independent of React and rendering. SVG is the initial 2D renderer; Three.js is the later 3D candidate. Persist versioned native documents; topology uses stable terminal IDs rather than screen coordinates. Commands support validated edits and undo. 2D and 3D consume the same device identities. Calculation modules expose units, assumptions and reference-case evidence.

Reuse canonical tokens and the official logo from hb-design-system. Reuse tested architectural patterns from AdigunElectroCAD only after license/ownership review; its source is not copied into this product. Do not import another product's account settings or simulated capabilities as production features.

Cloudflare Pages can host the static client; Workers is a candidate for bounded API/AI requests. Heavy geometry conversion and PDF jobs may need separate services. Supabase/PostgreSQL is a candidate for later owner-scoped persistence, subject to architecture review and actual service provisioning. No hosting, database, credentials or AI service is configured by this audit.

Vitest covers deterministic domain behavior; React Testing Library covers UI; Playwright covers native editing, persistence and localization flows. Engineering reference cases and per-project reports are separate from render/build success. Select exact compatible dependency versions and lock them in Milestone 1.
