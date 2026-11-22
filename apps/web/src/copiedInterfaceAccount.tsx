import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  dictionaries,
  isLanguage,
  type MessageKey,
} from "../../../packages/localization";
import { AccountPanel } from "./AccountPanel";
import "./compactPanelEstimates.ts";
import "./compactPlcLibrary.ts";
import { rasterizeDrawingSvg } from "./drawingPng.ts";
import { requestGuestTrial, useAccount } from "./useAccount";
import "./account.css";
import "./copiedInterfaceAccount.css";

Object.assign(window, { AdigunRasterizeDrawing: rasterizeDrawingSvg });

const trialMarker = "adiguneplanai.guest-started.v1";
const workspace = document.querySelector<HTMLElement>("#app")!;
const toolbarAccount = document.querySelector<HTMLButtonElement>(
  "#eplan-account-button",
)!;

function WorkspaceAccount() {
  const account = useAccount();
  const dialog = useRef<HTMLDialogElement>(null);
  const [access, setAccess] = useState<
    "checking" | "guest" | "required" | "expired"
  >("checking");
  const language = document.documentElement.lang;
  const dictionary = dictionaries[isLanguage(language) ? language : "en"];
  const t = (key: MessageKey) => dictionary[key];
  const allowed = account.verified || access === "guest";
  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) dialog.current?.showModal();
    };
    toolbarAccount.addEventListener("click", open);
    return () => toolbarAccount.removeEventListener("click", open);
  }, []);
  useEffect(() => {
    let active = true;
    let expiration: ReturnType<typeof setTimeout> | undefined;
    if (account.verified) {
      try {
        localStorage.setItem(trialMarker, "1");
      } catch {
        /* The verified session remains usable. */
      }
      setAccess("required");
    } else if (account.checking) {
      setAccess("checking");
    } else {
      const started = performance.now();
      void Promise.resolve()
        .then(() => requestGuestTrial(!localStorage.getItem(trialMarker)))
        .then((remaining) => {
          if (!active) return;
          localStorage.setItem(trialMarker, "1");
          const delay = remaining - (performance.now() - started);
          setAccess(delay > 0 ? "guest" : "expired");
          if (delay > 0)
            expiration = setTimeout(() => setAccess("expired"), delay);
        })
        .catch(() => {
          if (active) setAccess("required");
        });
    }
    return () => {
      active = false;
      clearTimeout(expiration);
    };
  }, [account.checking, account.verified]);
  useEffect(() => {
    workspace.inert = !allowed;
    if (!allowed) {
      for (const open of document.querySelectorAll<HTMLDialogElement>(
        "dialog[open]",
      )) {
        if (open !== dialog.current) open.close();
      }
    }
  }, [allowed]);
  return (
    <>
      {!allowed && (
        <section id="eplan-workspace-gate" aria-label={t("account")}>
          <div>
            <h1>adigunEplanAI</h1>
            <p role="status">
              {t(
                access === "checking"
                  ? "accountChecking"
                  : access === "expired"
                    ? "accountGuestExpired"
                    : "accountAccessRequired",
              )}
            </p>
            <button type="button" onClick={() => dialog.current?.showModal()}>
              {t("accountSignIn")}
            </button>
          </div>
        </section>
      )}
      <AccountPanel account={account} dialog={dialog} t={t} />
    </>
  );
}

createRoot(document.querySelector<HTMLElement>("#eplan-account-root")!).render(
  <WorkspaceAccount />,
);
