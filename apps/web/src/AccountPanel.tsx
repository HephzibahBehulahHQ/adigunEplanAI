import { useEffect, useRef, useState, type RefObject } from "react";
import type { MessageKey } from "../../../packages/localization";
import { profileName, type Account } from "./useAccount";
import type { NativeProjects } from "./useNativeProjects";
import { CloudProjectPanel } from "./CloudProjectPanel";
import { validateAvatarFile } from "../../../packages/project-storage/avatar.ts";

type Props = {
  account: Account;
  native: NativeProjects;
  dialog: RefObject<HTMLDialogElement | null>;
  t: (key: MessageKey) => string;
};
export function AccountPanel({ account, native, dialog, t }: Props) {
  const [mode, setMode] = useState<"signIn" | "register" | "reset">("signIn");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);
  const active = useRef(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const pickVersion = useRef(0);
  const clearPreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setAvatarFile(null);
    setPreview(null);
  };
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);
  useEffect(() => {
    if (account.recovery && !dialog.current?.open) dialog.current?.showModal();
  }, [account.recovery, dialog]);
  const perform = async (
    operation: () => Promise<void>,
    success: MessageKey | null,
  ) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await operation();
      if (active.current) setMessage(success);
    } catch {
      if (active.current) setMessage("accountFailure");
    } finally {
      if (active.current) setBusy(false);
    }
  };
  return (
    <dialog ref={dialog} className="account-dialog" aria-label={t("account")}>
      <header>
        <h2>{t("account")}</h2>
        <button type="button" onClick={() => dialog.current?.close()}>
          {t("close")}
        </button>
      </header>
      <p>{t("accountLocalScope")}</p>
      {(account.checking || account.error) && (
        <p role="status">
          {t(account.checking ? "accountChecking" : "accountFailure")}
        </p>
      )}
      {message && <p role="status">{t(message)}</p>}
      {!account.verified && account.error && (
        <button
          disabled={busy || account.checking}
          onClick={() => void perform(account.retryVerification, null)}
        >
          {t("accountRetryVerify")}
        </button>
      )}
      {account.user ? (
        <>
          <p>{account.user.email}</p>
          {!account.verified && <p>{t("accountOffline")}</p>}
          <form
            aria-label={t("avatarUpload")}
            onSubmit={(event) => {
              event.preventDefault();
              if (avatarFile)
                void perform(async () => {
                  await account.uploadAvatar(avatarFile);
                  if (active.current) {
                    clearPreview();
                    if (avatarInput.current) avatarInput.current.value = "";
                  }
                }, "avatarSaved");
            }}
          >
            {(preview || account.avatarUrl) && (
              <img
                className="account-avatar-preview"
                src={preview ?? account.avatarUrl!}
                alt={t("avatarPreview")}
              />
            )}
            <label>
              {t("avatarChoose")}
              <input
                ref={avatarInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy || !account.verified}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  const version = ++pickVersion.current;
                  clearPreview();
                  setMessage(null);
                  if (!file) return;
                  void (async () => {
                    try {
                      await validateAvatarFile(file);
                      const bitmap = await createImageBitmap(file);
                      bitmap.close();
                      if (!active.current || version !== pickVersion.current)
                        return;
                      const url = URL.createObjectURL(file);
                      previewUrl.current = url;
                      setPreview(url);
                      setAvatarFile(file);
                    } catch {
                      if (active.current && version === pickVersion.current)
                        setMessage("avatarInvalid");
                    }
                  })();
                }}
              />
            </label>
            <button disabled={busy || !account.verified || !avatarFile}>
              {t("avatarUpload")}
            </button>
            {account.avatarPath && (
              <button
                type="button"
                disabled={busy || !account.verified}
                onClick={() =>
                  void perform(account.removeAvatar, "avatarRemoved")
                }
              >
                {t("avatarRemove")}
              </button>
            )}
          </form>
          <p>{t("avatarScope")}</p>
          <form
            aria-label={t("accountProfile")}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const name = String(new FormData(form).get("name"));
              void perform(
                () => account.updateProfile(name),
                "accountProfileSaved",
              );
            }}
          >
            <label>
              {t("accountDisplayName")}
              <input
                key={profileName(account.user)}
                name="name"
                defaultValue={profileName(account.user)}
                maxLength={160}
                required
                autoComplete="name"
              />
            </label>
            <button disabled={busy || !account.verified}>
              {t("accountProfile")}
            </button>
          </form>
          <form
            aria-label={t("accountPasswordUpdate")}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const password = String(new FormData(form).get("password"));
              void perform(async () => {
                await account.updatePassword(password);
                form.reset();
              }, "accountPasswordSaved");
            }}
          >
            <label>
              {t("accountNewPassword")}
              <input
                name="password"
                type="password"
                minLength={8}
                maxLength={256}
                required
                autoComplete="new-password"
              />
            </label>
            <button disabled={busy || !account.verified}>
              {t("accountPasswordUpdate")}
            </button>
          </form>
          <CloudProjectPanel account={account} native={native} t={t} />
          <button
            onClick={() => {
              void account.signOut().catch(() => {
                if (active.current) setMessage("accountFailure");
              });
            }}
          >
            {t("accountSignOut")}
          </button>
        </>
      ) : (
        <>
          <div className="account-actions">
            {(["signIn", "register", "reset"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setMessage(null);
                }}
              >
                {t(
                  value === "signIn"
                    ? "accountSignIn"
                    : value === "register"
                      ? "accountRegister"
                      : "accountReset",
                )}
              </button>
            ))}
          </div>
          <form
            key={mode}
            aria-label={t("accountCredentials")}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const email = String(data.get("email"));
              const password = String(data.get("password") ?? "");
              void perform(
                async () => {
                  if (mode === "signIn") await account.signIn(email, password);
                  else if (mode === "register")
                    await account.register(email, password);
                  else await account.resetPassword(email);
                  form.reset();
                },
                mode === "signIn" ? "accountSignedIn" : "accountCheckEmail",
              );
            }}
          >
            <label>
              {t("accountEmail")}
              <input
                name="email"
                type="email"
                maxLength={320}
                required
                autoComplete="email"
              />
            </label>
            {mode !== "reset" && (
              <label>
                {t("accountPassword")}
                <input
                  name="password"
                  type="password"
                  minLength={mode === "register" ? 8 : 1}
                  maxLength={256}
                  required
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
              </label>
            )}
            <button disabled={busy || account.checking}>
              {t("accountContinue")}
            </button>
          </form>
        </>
      )}
    </dialog>
  );
}
