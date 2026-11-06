import { useEffect, useMemo, useRef, useState } from "react";
import {
  CloudError,
  CloudProjects,
  type CloudProjectSummary,
  type CloudRevision,
} from "../../../packages/project-storage/cloud.ts";
import { accountStorageKey } from "../../../packages/project-storage/repository.ts";
import { serializeProject } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import { supabasePublishableKey, supabaseUrl } from "./publicBackendConfig";
import type { Account } from "./useAccount";
import type { NativeProjects } from "./useNativeProjects";

type Props = {
  account: Account;
  native: NativeProjects;
  t: (key: MessageKey) => string;
};
const messages = {
  conflict: "cloudConflict",
  unavailable: "cloudUnavailable",
  denied: "cloudDenied",
  signedOut: "cloudDenied",
  accountChanged: "cloudAccountChanged",
  invalidResponse: "cloudInvalid",
} as const;
export function CloudProjectPanel({ account, native, t }: Props) {
  const ownerId = account.user!.id;
  const pendingKey = `${accountStorageKey(ownerId)}.pending-cloud`;
  const cloud = useMemo(
    () =>
      new CloudProjects({
        projectRef: new URL(supabaseUrl).hostname.split(".")[0],
        publishableKey: supabasePublishableKey,
        ownerId,
        session: account.cloudSession,
      }),
    [ownerId, account.cloudSession],
  );
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [items, setItems] = useState<CloudProjectSummary[]>([]);
  const [more, setMore] = useState(false);
  const [history, setHistory] = useState<{
    id: string;
    items: CloudRevision[];
    more: boolean;
  } | null>(null);
  const [bases, setBases] = useState<Record<string, number | null>>({});
  const [conflict, setConflict] = useState<string | null>(null);
  const [pending, setPending] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(pendingKey) ?? "[]",
      );
      return Array.isArray(value)
        ? value
            .filter(
              (id): id is string =>
                typeof id === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(id),
            )
            .slice(0, 100)
        : [];
    } catch {
      return [];
    }
  });
  const updatePending = (id: string, add: boolean) => {
    setPending((previous) => {
      const next = add
        ? [...new Set([...previous, id])].slice(0, 100)
        : previous.filter((value) => value !== id);
      try {
        localStorage.setItem(pendingKey, JSON.stringify(next));
      } catch {
        /* Local project save status remains visible independently. */
      }
      return next;
    });
  };
  const run = async (operation: () => Promise<void>) => {
    if (busy || !account.verified) return;
    setBusy(true);
    setMessage(null);
    try {
      await operation();
    } catch (error) {
      if (active.current)
        setMessage(
          error instanceof CloudError ? messages[error.code] : "cloudInvalid",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const list = (append = false) =>
    run(async () => {
      const result = await cloud.list(append ? items.length : 0);
      if (!active.current) return;
      setItems(append ? [...items, ...result.items] : result.items);
      setMore(result.hasMore);
    });
  const load = (id: string, revision?: number) =>
    run(async () => {
      const snapshot =
        revision === undefined
          ? await cloud.load(id)
          : await cloud.loadRevision(id, revision);
      if (!active.current) return;
      if (!snapshot) {
        setMessage("cloudMissing");
        return;
      }
      if (
        native.importText(serializeProject(snapshot.project), () =>
          window.confirm(t("cloudReplaceLocal")),
        )
      ) {
        setBases((previous) => ({ ...previous, [id]: snapshot.revision }));
        setConflict(null);
        updatePending(id, false);
        setMessage(
          revision === undefined ? "cloudLoaded" : "cloudHistoryLoaded",
        );
      }
    });
  const save = (replace = false) =>
    run(async () => {
      const project = native.project;
      if (!project) return;
      let expectedRevision = bases[project.id] ?? null;
      if (replace) {
        const latest = await cloud.load(project.id);
        if (!active.current) return;
        if (!window.confirm(t("cloudReplaceRemote"))) return;
        expectedRevision = latest?.revision ?? null;
      }
      try {
        const result = await cloud.save(project, expectedRevision);
        if (!active.current) return;
        setBases((previous) => ({
          ...previous,
          [project.id]: result.revision,
        }));
        updatePending(project.id, false);
        setConflict(null);
        setMessage("cloudSaved");
      } catch (error) {
        if (active.current && error instanceof CloudError) {
          if (error.code === "conflict") setConflict(project.id);
          if (error.code === "unavailable") updatePending(project.id, true);
        }
        throw error;
      }
    });
  const review = (id: string) =>
    run(async () => {
      const latest = await cloud.load(id);
      if (!active.current) return;
      if (latest) {
        setConflict(id);
        setMessage("cloudConflict");
      } else {
        setBases((previous) => ({ ...previous, [id]: null }));
        updatePending(id, false);
        setMessage("cloudRetryReady");
      }
    });
  const showHistory = (id: string, append = false) =>
    run(async () => {
      const result = await cloud.history(
        id,
        append && history?.id === id ? history.items.length : 0,
      );
      if (active.current)
        setHistory({
          id,
          items:
            append && history?.id === id
              ? [...history.items, ...result.items]
              : result.items,
          more: result.hasMore,
        });
    });
  return (
    <section className="account-cloud" aria-label={t("cloudProjects")}>
      <h3>{t("cloudProjects")}</h3>
      <p>{t("cloudScope")}</p>
      {message && <p role="status">{t(message)}</p>}
      <div className="account-actions">
        <button
          disabled={busy || !account.verified}
          onClick={() => void list()}
        >
          {t("cloudRefresh")}
        </button>
        <button
          disabled={
            busy ||
            !account.verified ||
            !native.project ||
            pending.includes(native.project.id)
          }
          onClick={() => void save()}
        >
          {t("cloudSave")}
        </button>
      </div>
      {conflict && (
        <div
          className="cloud-conflict"
          role="group"
          aria-label={t("cloudConflict")}
        >
          <p>{t("cloudConflict")}</p>
          <button
            disabled={busy || !account.verified}
            onClick={() => void load(conflict)}
          >
            {t("cloudLoadLatest")}
          </button>
          {native.project?.id === conflict && (
            <button
              disabled={busy || !account.verified}
              onClick={() => void save(true)}
            >
              {t("cloudReplaceButton")}
            </button>
          )}
        </div>
      )}
      {pending.length > 0 && (
        <section aria-label={t("cloudPending")}>
          <h4>{t("cloudPending")}</h4>
          <p>{t("cloudPendingScope")}</p>
          <ul>
            {pending.map((id) => (
              <li key={id}>
                {native.projects.find((p) => p.id === id)?.name ?? id}{" "}
                <button
                  disabled={busy || !account.verified}
                  onClick={() => void review(id)}
                >
                  {t("cloudReviewPending")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>{" "}
            <span>
              {t("cloudRevision")} {item.revision} ·{" "}
              <time dateTime={item.updatedAt}>
                {new Date(item.updatedAt).toLocaleString()}
              </time>
            </span>
            <button
              disabled={busy || !account.verified}
              onClick={() => void load(item.id)}
            >
              {t("cloudOpen")}: {item.name}
            </button>
            <button
              disabled={busy || !account.verified}
              onClick={() => void showHistory(item.id)}
            >
              {t("cloudHistory")}: {item.name}
            </button>
          </li>
        ))}
      </ul>
      {more && (
        <button
          disabled={busy || !account.verified}
          onClick={() => void list(true)}
        >
          {t("cloudMore")}
        </button>
      )}
      {history && (
        <section aria-label={t("cloudHistory")}>
          <h4>{t("cloudHistory")}</h4>
          <p>{t("cloudHistoryScope")}</p>
          <ul>
            {history.items.map((item) => (
              <li key={item.revision}>
                <span>
                  {t("cloudRevision")} {item.revision} ·{" "}
                  <time dateTime={item.updatedAt}>
                    {new Date(item.updatedAt).toLocaleString()}
                  </time>
                </span>
                <button
                  disabled={busy || !account.verified}
                  onClick={() => void load(history.id, item.revision)}
                >
                  {t("cloudRestore")} {item.revision}
                </button>
              </li>
            ))}
          </ul>
          {history.more && (
            <button
              disabled={busy || !account.verified}
              onClick={() => void showHistory(history.id, true)}
            >
              {t("cloudMore")}
            </button>
          )}
        </section>
      )}
    </section>
  );
}
