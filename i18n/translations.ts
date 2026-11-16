import { id } from "./locales/id";
import { en } from "./locales/en";

export const dictionary = {
  id,
  en,
};

export type Locale = keyof typeof dictionary;
export type TranslationKeys = typeof id;

