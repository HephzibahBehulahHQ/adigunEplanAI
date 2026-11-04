import en from "./en.json";
import de from "./de.json";
import yo from "./yo.json";
import pcm from "./pcm.json";
export const dictionaries = { en, de, yo, pcm };
export type Language = keyof typeof dictionaries;
export type MessageKey = keyof typeof en;
export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && Object.hasOwn(dictionaries, value);
}
