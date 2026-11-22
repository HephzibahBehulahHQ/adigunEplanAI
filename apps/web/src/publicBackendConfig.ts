// Public client configuration for the owner-authorized shared HQ project.
// Privileged credentials must never be added to this file.
const hostedSupabaseUrl = "https://fqcbfnktdvqojyezxeis.supabase.co";
const hostedSupabasePublishableKey =
  "sb_publishable_kUwuugYcMSOUVfSicQE1TQ_2j_B6P8o";

const localPreview =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  import.meta.env.VITE_EPLAN_LOCAL_SUPABASE_URL === "http://127.0.0.1:54321";

export const supabaseUrl = localPreview
  ? import.meta.env.VITE_EPLAN_LOCAL_SUPABASE_URL
  : hostedSupabaseUrl;
export const supabasePublishableKey = localPreview
  ? import.meta.env.VITE_EPLAN_LOCAL_SUPABASE_ANON_KEY
  : hostedSupabasePublishableKey;
