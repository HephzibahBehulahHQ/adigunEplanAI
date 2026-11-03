import {
  parseProject,
  serializeProject,
  type Project,
} from "../electrical-model/project.ts";

export type CloudSession = { userId: string; accessToken: string };
export type CloudSnapshot = {
  project: Project;
  revision: number;
  updatedAt: string;
};
export class CloudError extends Error {
  readonly code:
    | "signedOut"
    | "accountChanged"
    | "conflict"
    | "invalidResponse"
    | "unavailable"
    | "denied";
  constructor(
    code:
      | "signedOut"
      | "accountChanged"
      | "conflict"
      | "invalidResponse"
      | "unavailable"
      | "denied",
  ) {
    super(code);
    this.code = code;
  }
}
type Options = {
  projectRef: string;
  publishableKey: string;
  session: () => Promise<CloudSession | null>;
  fetch?: typeof fetch;
};

/** Auth is supplied by the session client; server RLS remains authoritative. */
export class CloudProjects {
  private readonly url: string;
  private readonly request: typeof fetch;
  private readonly options: Options;
  constructor(options: Options) {
    this.options = options;
    if (
      !/^[a-z]{20}$/.test(options.projectRef) ||
      !/^sb_publishable_[\w-]+$/.test(options.publishableKey)
    )
      throw new Error(
        "A Supabase project reference and publishable key are required",
      );
    this.url = `https://${options.projectRef}.supabase.co/rest/v1/projects`;
    this.request = options.fetch ?? fetch;
  }
  private async session() {
    const session = await this.options.session();
    if (!session?.accessToken || !/^[0-9a-f-]{36}$/i.test(session.userId))
      throw new CloudError("signedOut");
    return session;
  }
  private async send(method: string, query: URLSearchParams, body?: unknown) {
    const session = await this.session();
    query.set("owner_id", `eq.${session.userId}`);
    let response: Response;
    try {
      response = await this.request(`${this.url}?${query}`, {
        method,
        redirect: "error",
        headers: {
          apikey: this.options.publishableKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Accept-Profile": "adiguneplanai",
          "Content-Profile": "adiguneplanai",
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new CloudError("unavailable");
    }
    if ((await this.options.session())?.userId !== session.userId)
      throw new CloudError("accountChanged");
    if (response.status === 409) throw new CloudError("conflict");
    if (response.status === 401 || response.status === 403)
      throw new CloudError("denied");
    if (!response.ok) throw new CloudError("unavailable");
    let rows: unknown;
    try {
      rows = await response.json();
    } catch {
      throw new CloudError("invalidResponse");
    }
    if (!Array.isArray(rows)) throw new CloudError("invalidResponse");
    if ((await this.options.session())?.userId !== session.userId)
      throw new CloudError("accountChanged");
    return { rows, owner: session.userId };
  }
  private snapshot(row: unknown, owner: string, id: string): CloudSnapshot {
    if (!row || typeof row !== "object")
      throw new CloudError("invalidResponse");
    const r = row as Record<string, unknown>;
    if (
      r.owner_id !== owner ||
      r.native_project_id !== id ||
      !Number.isSafeInteger(r.revision) ||
      Number(r.revision) < 1 ||
      typeof r.updated_at !== "string" ||
      !Number.isFinite(Date.parse(r.updated_at))
    )
      throw new CloudError("invalidResponse");
    try {
      const project = parseProject(JSON.stringify(r.payload)).project;
      if (project.id !== id) throw new Error("Identity mismatch");
      return { project, revision: Number(r.revision), updatedAt: r.updated_at };
    } catch {
      throw new CloudError("invalidResponse");
    }
  }
  async load(id: string): Promise<CloudSnapshot | null> {
    const { rows, owner } = await this.send(
      "GET",
      new URLSearchParams({
        native_project_id: `eq.${id}`,
        select: "*",
        limit: "2",
      }),
    );
    if (rows.length > 1) throw new CloudError("invalidResponse");
    return rows.length ? this.snapshot(rows[0], owner, id) : null;
  }
  async save(
    project: Project,
    expectedRevision: number | null,
  ): Promise<CloudSnapshot> {
    // Serialize before any network operation: invalid native models never leave the device.
    const payload: unknown = JSON.parse(serializeProject(project));
    if (
      expectedRevision !== null &&
      (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)
    )
      throw new Error("Invalid expected revision");
    const query = new URLSearchParams({ select: "*" });
    if (expectedRevision !== null) {
      query.set("native_project_id", `eq.${project.id}`);
      query.set("revision", `eq.${expectedRevision}`);
    }
    const { rows, owner } = await this.send(
      expectedRevision === null ? "POST" : "PATCH",
      query,
      expectedRevision === null
        ? { native_project_id: project.id, payload }
        : { payload },
    );
    if (rows.length === 0) throw new CloudError("conflict");
    if (rows.length !== 1) throw new CloudError("invalidResponse");
    const snapshot = this.snapshot(rows[0], owner, project.id);
    if (
      snapshot.revision !==
      (expectedRevision === null ? 1 : expectedRevision + 1)
    )
      throw new CloudError("invalidResponse");
    return snapshot;
  }
}
