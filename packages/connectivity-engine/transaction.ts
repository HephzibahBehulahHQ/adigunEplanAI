import type { Project } from "../electrical-model/project.ts";
import { synchronizeConnectivity } from "./analyze.ts";

/** Physical edits run without stale derived references; analysis and edits commit together. */
export function electricalTransaction(
  project: Project,
  change: (draft: Project) => Project,
): Project {
  const draft = structuredClone(project);
  const previousNets = draft.nets;
  const previousFindings = draft.findings;
  draft.nets = [];
  draft.findings = [];
  const changed = change(draft);
  changed.nets = previousNets;
  changed.findings = [
    ...previousFindings.filter(
      (old) => !changed.findings.some((finding) => finding.id === old.id),
    ),
    ...changed.findings,
  ];
  return synchronizeConnectivity(changed);
}
