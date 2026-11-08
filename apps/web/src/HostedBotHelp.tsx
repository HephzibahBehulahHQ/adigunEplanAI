import { useEffect, useRef, useState } from "react";
import type { MessageKey } from "../../../packages/localization";
import { signInForBot, signOutOfBot } from "./botAccount";
import { HostedBotError, requestHostedHelp } from "./requestHostedHelp";

export function HostedBotHelp({
  publishableKey,
  t,
}: {
  publishableKey: string;
  t: (key: MessageKey) => string;
}) {
  const [session, setSession] =
    useState<Awaited<ReturnType<typeof signInForBot>>>();
  const [answer, setAnswer] =
    useState<Awaited<ReturnType<typeof requestHostedHelp>>>();
  const [status, setStatus] = useState<MessageKey>();
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => {
        activeRequest.current?.abort();
        activeRequest.current = null;
        setSession(undefined);
        setAnswer(undefined);
        setBusy(false);
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session]);

  async function run(
    action: (signal: AbortSignal) => Promise<void>,
    fallback: MessageKey,
  ) {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setStatus(undefined);
    try {
      await action(
        AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof HostedBotError && error.code === "signedOut") {
        setSession(undefined);
        setAnswer(undefined);
        setStatus("botHostedSignIn");
      } else {
        setStatus(
          error instanceof HostedBotError && error.code === "rateLimited"
            ? "botHostedRate"
            : fallback,
        );
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
  }

  return (
    <details className="bot-chat">
      <summary>{t("botHostedHelp")}</summary>
      {session ? (
        <>
          <button
            type="button"
            onClick={() => {
              activeRequest.current?.abort();
              activeRequest.current = null;
              setSession(undefined);
              setAnswer(undefined);
              setBusy(false);
              setStatus(undefined);
              void signOutOfBot(publishableKey, session.accessToken).catch(
                () => {},
              );
            }}
          >
            {t("botHostedSignOut")}
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const question = String(new FormData(form).get("question") ?? "");
              void run(async (signal) => {
                const result = await requestHostedHelp(
                  question,
                  session.accessToken,
                  signal,
                );
                if (signal.aborted) return;
                setAnswer(result);
                form.reset();
              }, "botHostedUnavailable");
            }}
          >
            <label>
              {t("botHostedQuestion")}
              <input name="question" required maxLength={500} />
            </label>
            <button disabled={busy}>{t("botAsk")}</button>
          </form>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            form.reset();
            void run(async (signal) => {
              const next = await signInForBot(
                publishableKey,
                String(data.get("email") ?? ""),
                String(data.get("password") ?? ""),
                signal,
              );
              if (!signal.aborted) setSession(next);
            }, "botHostedSignInFailed");
          }}
        >
          <label>
            {t("botEmail")}
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            {t("botPassword")}
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy}>{t("botHostedSignIn")}</button>
        </form>
      )}
      <div role="status">
        {busy ? (
          <p>{t("botHostedWorking")}</p>
        ) : status ? (
          <p>{t(status)}</p>
        ) : null}
        {answer &&
          (answer.length ? (
            <ul lang="en">
              {answer.map(({ title, excerpt, document }) => (
                <li key={title}>
                  <strong>
                    {title} · {document}
                  </strong>
                  <p>{excerpt}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("botNoHelpMatches")}</p>
          ))}
      </div>
    </details>
  );
}
