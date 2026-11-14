# 3000 Solid Engineering Projects to Work On

Owner-requested engineering planning library: **3,000 project briefs, each with 30 individually specified sheets**, using one project with A1–A4 sections. This expands the planning backlog beyond the master specification's 500 implemented-example target; it does not change the number of validated native examples.

Start with [NEXT_AGENT.md](NEXT_AGENT.md), then [TEMPLATE.md](TEMPLATE.md). The ten domain indexes below are published incrementally, 300 projects per domain. A missing index means that batch has not yet been published.

| Domain | IDs | Index |
| --- | --- | --- |
| Residential | ENG-0001–0300 | [Index](indexes/residential.json) |
| Commercial | ENG-0301–0600 | [Index](indexes/commercial.json) |
| Motor control | ENG-0601–0900 | [Index](indexes/motor-control.json) |
| PLC and automation | ENG-0901–1200 | [Index](indexes/plc-automation.json) |
| Panel engineering | ENG-1201–1500 | [Index](indexes/panel-engineering.json) |
| Power distribution | ENG-1501–1800 | [Index](indexes/power-distribution.json) |
| Renewables and storage | ENG-1801–2100 | [Index](indexes/renewables-storage.json) |
| Lighting | ENG-2101–2400 | [Index](indexes/lighting.json) |
| Low-voltage/security interfaces | ENG-2401–2700 | [Index](indexes/low-voltage-security.json) |
| Protection and integrated systems | ENG-2701–3000 | [Index](indexes/protection-integrated.json) |

Each domain contains ten base systems with thirty functional requirement packages each. These are explicitly identified engineering variants, not 3,000 unrelated circuit topologies. Each variant changes a control, monitoring, distribution or installation requirement, with its own acceptance scenario. The next agent must implement those differences and validate each project individually; renaming one drawing does not complete a project.

Each index records ID, title, base system, variant, status, sheet count and project-file path (relative to this folder). Each project file describes every sheet's required content. Source definitions are in domains.json and variants.json. Reproduce a batch with `python3 catalog.py --generate residential`; validate the full library with `python3 catalog.py --complete` from this folder.

The published download root is `/engineering-projects/README.md`. Publication uses the existing verified Pages workflow, without changing the application interface. Static documents are a planning library, not an automatically populated native EPLAN/app library.

Germany is a useful educational reference context, not a verified installation location. Record the actual country, applicable standards/editions, supply and earthing before releasing a design. Unknown values remain explicit assumptions or unresolved inputs. Do not invent manufacturer approvals, test results, cable sizing or protection settings.
