export const SUPPORTED_LOCALES = [
    { code: "en", label: "English" },
    { code: "th", label: "ไทย" }
] as const;

export const DEFAULT_LOCALE = SUPPORTED_LOCALES[0].code;

export type SupportedLocaleCode = typeof SUPPORTED_LOCALES[number]["code"];
