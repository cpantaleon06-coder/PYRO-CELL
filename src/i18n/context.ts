import { createContext, useContext } from "react";
import type { Lang } from "../lib/lang";
import type { Dict } from "./dict";

export interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
  locale: string;
  /** Número con separadores del idioma y `digits` decimales fijos. */
  n: (value: number, digits?: number) => string;
  /** Porcentaje (recibe 0-100) con la convención del idioma: "30%" o "30 %". */
  p: (value: number, digits?: number) => string;
  /** Nombre del mes a partir de la clave "Jan"…"Dec" de constants.ts. */
  month: (key: string, style?: "long" | "short") => string;
}

export const I18nContext = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <LangProvider>");
  return ctx;
}
