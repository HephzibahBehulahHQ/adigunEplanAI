import { useCallback, useEffect, useRef, useState } from "react";
import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type User,
} from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./publicBackendConfig";
import type { CloudSession } from "../../../packages/project-storage/cloud.ts";
import {
  ownedAvatarPath,
  PrivateAvatars,
} from "../../../packages/project-storage/avatar.ts";

export const authStorageKey = "adiguneplanai.auth.v1";
// A distinct storage key and local sign-out scope keep this app's browser session separate.
const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  global: {
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: AbortSignal.any([
          ...(init?.signal ? [init.signal] : []),
          AbortSignal.timeout(10000),
        ]),
      }),
  },
  auth: {
    storageKey: authStorageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
type AccountState = {
  user: User | null;
  checking: boolean;
  error: boolean;
};
export function profileName(user: User | null): string {
  const value: unknown =
    user?.user_metadata?.adiguneplanai_profile?.display_name;
  return typeof value === "string" ? value.slice(0, 160) : "";
}

type AccountIntent = "sign-in" | "register" | "reset-password";

async function productAccountRequest(payload: Record<string, unknown>) {
  const response = await fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "accountFailure");
  return result;
}

export async function requestGuestTrial(allowStart: boolean): Promise<number> {
  const result = await productAccountRequest({ step: "guest", allowStart });
  if (
    result.step !== "guest" ||
    !Number.isInteger(result.remainingMs) ||
    result.remainingMs < 0 ||
    result.remainingMs > 240_000
  ) {
    throw new Error("accountFailure");
  }
  return result.remainingMs;
}

async function checkProductSession(accessToken: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/adiguneplanai_has_verified_product_session`,
    {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  if (!response.ok) throw new Error("accountFailure");
  return (await response.json()) === true;
}

export function useAccount() {
  const [state, setState] = useState<AccountState>({
    user: null,
    checking: true,
    error: false,
  });
  const verified = useRef<CloudSession | null>(null);
  const epoch = useRef(0);
  const alive = useRef(true);
  const reverify = useRef<
    ((event: AuthChangeEvent, session: Session | null) => void) | null
  >(null);
  const [avatar, setAvatar] = useState<{
    owner: string;
    path: string;
    url: string;
  } | null>(null);
  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const initializationTimeout = setTimeout(() => {
      if (alive.current)
        setState((previous) =>
          previous.checking
            ? { user: null, checking: false, error: true }
            : previous,
        );
    }, 12000);
    const onChange = (_event: AuthChangeEvent, session: Session | null) => {
      clearTimeout(initializationTimeout);
      const version = ++epoch.current;
      verified.current = null;
      setState((previous) => ({
        user: session?.user.id === previous.user?.id ? previous.user : null,
        checking: Boolean(session),
        error: false,
      }));
      if (timer) clearTimeout(timer);
      if (!session) return;
      // Keep async Auth calls outside the state-change callback.
      timer = setTimeout(() => {
        void supabase.auth
          .getUser(session.access_token)
          .then(async ({ data, error }) => {
            if (!alive.current || epoch.current !== version) return;
            const user = data.user;
            if (
              error ||
              !user ||
              user.id !== session.user.id ||
              user.is_anonymous ||
              session.user.is_anonymous ||
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                user.id,
              )
            ) {
              const transient = Boolean(
                error &&
                (!error.status || error.status >= 500 || error.status === 429),
              );
              setState((previous) => ({
                user:
                  transient && previous.user?.id === session.user.id
                    ? previous.user
                    : null,
                checking: false,
                error: true,
              }));
              return;
            }
            const productVerified = await checkProductSession(
              session.access_token,
            );
            if (!alive.current || epoch.current !== version) return;
            if (!productVerified) {
              setState({ user: null, checking: false, error: false });
              return;
            }
            verified.current = {
              userId: user.id,
              accessToken: session.access_token,
              epoch: version,
            };
            setState((previous) => ({
              ...previous,
              user,
              checking: false,
              error: false,
            }));
          })
          .catch(() => {
            if (alive.current && epoch.current === version)
              setState((previous) => ({
                user:
                  previous.user?.id === session.user.id ? previous.user : null,
                checking: false,
                error: true,
              }));
          });
      }, 0);
    };
    reverify.current = onChange;
    const subscription =
      supabase.auth.onAuthStateChange(onChange).data.subscription;
    return () => {
      alive.current = false;
      ++epoch.current;
      verified.current = null;
      reverify.current = null;
      if (timer) clearTimeout(timer);
      clearTimeout(initializationTimeout);
      subscription.unsubscribe();
    };
  }, []);
  const cloudSession = useCallback(
    async () => (verified.current ? { ...verified.current } : null),
    [],
  );
  const accountVerified = Boolean(verified.current) && !state.checking;
  const ownerId = state.user?.id ?? null;
  const storedPath: unknown =
    state.user?.user_metadata?.adiguneplanai_profile?.avatar_path;
  const avatarPath =
    ownerId && ownedAvatarPath(ownerId, storedPath) ? storedPath : null;
  useEffect(() => {
    if (!ownerId || !avatarPath || !accountVerified) {
      setAvatar(null);
      return;
    }
    let current = true;
    const client = new PrivateAvatars({
      url: supabaseUrl,
      publishableKey: supabasePublishableKey,
      ownerId,
      session: cloudSession,
    });
    const refresh = () => {
      void client
        .signedUrl(avatarPath)
        .then((url) => {
          if (current) setAvatar({ owner: ownerId, path: avatarPath, url });
        })
        .catch(() => {
          if (current) setAvatar(null);
        });
    };
    refresh();
    const interval = setInterval(refresh, 240000);
    return () => {
      current = false;
      clearInterval(interval);
    };
  }, [ownerId, avatarPath, accountVerified, cloudSession]);
  async function updateBoundUser(
    attributes: {
      data?: Record<string, unknown>;
    },
    current = verified.current,
  ) {
    if (
      !current ||
      !verified.current ||
      verified.current?.epoch !== current.epoch ||
      verified.current.userId !== current.userId
    )
      throw new Error("accountFailure");
    // Bind mutations to the verified token captured for this account. An Auth
    // storage event must not redirect an in-flight profile/password edit to another user.
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${current.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attributes),
    });
    if (!response.ok) throw new Error("accountFailure");
    const user = (await response.json()) as User;
    if (
      !alive.current ||
      verified.current?.epoch !== current.epoch ||
      user.id !== current.userId ||
      user.is_anonymous
    )
      throw new Error("accountFailure");
    setState((previous) => ({ ...previous, user }));
  }
  async function currentProfile(current = verified.current) {
    if (!current) throw new Error("accountFailure");
    const { data, error } = await supabase.auth.getUser(current.accessToken);
    if (
      error ||
      data.user?.id !== current.userId ||
      verified.current?.epoch !== current.epoch
    )
      throw new Error("accountFailure");
    const value: unknown = data.user.user_metadata.adiguneplanai_profile;
    const profile =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    return { current, profile };
  }
  return {
    ...state,
    verified: accountVerified,
    avatarPath,
    avatarUrl:
      avatar?.owner === ownerId && avatar.path === avatarPath
        ? avatar.url
        : null,
    cloudSession,
    async retryVerification() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error("accountFailure");
      if (alive.current) reverify.current?.("SIGNED_IN", data.session);
    },
    async uploadAvatar(file: File) {
      const current = verified.current;
      if (!current) throw new Error("accountFailure");
      const client = new PrivateAvatars({
        url: supabaseUrl,
        publishableKey: supabasePublishableKey,
        ownerId: current.userId,
        session: cloudSession,
      });
      const path = await client.upload(file);
      const { profile } = await currentProfile(current);
      await updateBoundUser(
        { data: { adiguneplanai_profile: { ...profile, avatar_path: path } } },
        current,
      );
    },
    async removeAvatar() {
      const { current, profile } = await currentProfile();
      const path = profile.avatar_path;
      await updateBoundUser(
        { data: { adiguneplanai_profile: { ...profile, avatar_path: null } } },
        current,
      );
      if (ownedAvatarPath(current.userId, path)) {
        const client = new PrivateAvatars({
          url: supabaseUrl,
          publishableKey: supabasePublishableKey,
          ownerId: current.userId,
          session: cloudSession,
        });
        await client.remove(path);
      }
    },
    async begin(intent: AccountIntent, email: string, password: string) {
      const result = await productAccountRequest({
        step: "begin",
        mode: intent,
        email: email.trim(),
        password,
      });
      if (result.step !== "verify") throw new Error("accountFailure");
    },
    async verify(
      code: string,
    ): Promise<"signed-in" | "registered" | "password-reset"> {
      const result = await productAccountRequest({
        step: "verify",
        code: code.trim(),
      });
      if (result.step === "signed-in") {
        if (
          typeof result.session?.access_token !== "string" ||
          typeof result.session?.refresh_token !== "string"
        )
          throw new Error("accountFailure");
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw new Error("accountFailure");
      } else if (result.step === "password-reset" && verified.current) {
        await supabase.auth.signOut({ scope: "local" });
      } else if (
        result.step !== "registered" &&
        result.step !== "password-reset"
      ) {
        throw new Error("accountFailure");
      }
      return result.step;
    },
    async updateProfile(displayName: string) {
      const current = verified.current;
      if (!current || !displayName.trim() || displayName.trim().length > 160)
        throw new Error("accountFailure");
      const { profile } = await currentProfile(current);
      await updateBoundUser(
        {
          data: {
            adiguneplanai_profile: {
              ...profile,
              display_name: displayName.trim(),
            },
          },
        },
        current,
      );
    },
    async signOut() {
      verified.current = null;
      ++epoch.current;
      setState({ user: null, checking: false, error: false });
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw new Error("accountFailure");
    },
  };
}
export type Account = ReturnType<typeof useAccount>;
