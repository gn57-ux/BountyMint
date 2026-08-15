import { zhCN, type Dictionary } from "./dictionaries/zh-CN";

export type { Dictionary };

export const defaultLocale = "zh-CN" as const;

const dictionaries = {
  "zh-CN": zhCN,
} as const;

export function getDictionary(locale: keyof typeof dictionaries = defaultLocale): Dictionary {
  return dictionaries[locale];
}

export const dictionary = getDictionary();
