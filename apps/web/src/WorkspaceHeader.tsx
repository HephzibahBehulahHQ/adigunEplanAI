import { version } from "../../../package.json";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import { profileName, type Account } from "./useAccount";
import { CommandIcon } from "./WorkspaceRibbon";
import approvedHeader from "./assets/approved-header-reference.png";
import "./workspace-header.css";

export function WorkspaceHeader({
  native,
  account,
  t,
  openAccount,
  openDiagnostics,
  openHelp,
}: {
  native: NativeProjects;
  account: Account;
  t: (key: MessageKey) => string;
  openAccount: () => void;
  openDiagnostics: () => void;
  openHelp: () => void;
}) {
  const accountName =
    profileName(account.user) || account.user?.email || t("headerGuest");
  return (
    <header className="app-header workbench-header">
      <div className="corporate-mark">
        {/* Only the owner-approved corporate mark is displayed; every adjacent control is native UI. */}
        <svg
          viewBox="6 12 254 56"
          role="img"
          aria-label="Hephzibah Behulah — BY HB ELEKTRONIKER"
        >
          <image href={approvedHeader} width="1857" height="211" />
        </svg>
      </div>
      <div className="product-heading">
        <div>
          <strong>AdigunEplanAI</strong>
          <span className="product-version">v{version}</span>
        </div>
        <small>{t("workbenchSubtitle")}</small>
      </div>
      <div className="project-save-chip">
        <span
          className="project-name project-title"
          title={native.project?.name}
        >
          {native.project?.name ?? t("noProject")}
        </span>
        {native.project && !native.saved && (
          <span className="dirty-marker" aria-hidden="true">
            *
          </span>
        )}
        <span
          className="project-save-state"
          role="status"
          title={t(native.saved ? "savedLocally" : "notSaved")}
        >
          <i
            data-save-state={native.saved ? "saved" : "unsaved"}
            aria-hidden="true"
          />
          {t(native.saved ? "savedLocally" : "notSaved")}
        </span>
      </div>
      <div
        className="owner-toolbar header-actions"
        aria-label={t("accountToolbar")}
      >
        <button
          className="header-action"
          aria-label={`${t("undo")} · ${t("header")}`}
          title={t("undo")}
          disabled={!native.canUndo}
          onClick={native.undo}
        >
          <CommandIcon kind="undo" />
        </button>
        <button
          className="header-action"
          aria-label={`${t("redo")} · ${t("header")}`}
          title={t("redo")}
          disabled={!native.canRedo}
          onClick={native.redo}
        >
          <CommandIcon kind="redo" />
        </button>
        <button
          className="header-action cloud-action"
          aria-label={t("cloudProjects")}
          title={t("cloudProjects")}
          onClick={openAccount}
        >
          <CommandIcon kind="cloud" />
        </button>
        <button
          className="header-action"
          aria-label={t("headerNotifications")}
          title={t("headerNotifications")}
          onClick={openDiagnostics}
        >
          <CommandIcon kind="bell" />
        </button>
        <button
          className="header-action"
          aria-label={t("help")}
          title={t("help")}
          onClick={openHelp}
        >
          <CommandIcon kind="help" />
        </button>
        <button
          className="header-profile profile-button"
          aria-label={t("account")}
          title={accountName}
          onClick={openAccount}
        >
          <span className="profile-picture">
            {account.avatarUrl ? (
              <img className="profile-avatar" src={account.avatarUrl} alt="" />
            ) : (
              <CommandIcon kind="profile" />
            )}
            <span
              className={`account-dot ${account.verified ? "verified" : ""}`}
              data-account-state={
                account.verified
                  ? "verified"
                  : account.checking
                    ? "checking"
                    : account.user
                      ? "unverified"
                      : "guest"
              }
              aria-label={t(
                account.verified
                  ? "accountSignedIn"
                  : account.user
                    ? "accountOffline"
                    : "accountGuest",
              )}
            />
          </span>
          <span className="profile-caption">
            <strong>{accountName}</strong>
            <small>
              {t(account.verified ? "headerSignedIn" : "headerLocalAccount")}
            </small>
          </span>
          <span className="profile-chevron" aria-hidden="true">
            ⌄
          </span>
        </button>
      </div>
    </header>
  );
}
