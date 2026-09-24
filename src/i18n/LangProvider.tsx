import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ALL_MONTHS } from "../lib/constants";
import { isLang, LANG_STORAGE_KEY, LOCALES, type Lang } from "../lib/lang";
import { I18nContext, type I18n } from "./context";
import { en, es, fr, pt, type Dict } from "./dict";

const DICTS: Record<Lang, Dict> = { es, en, fr, pt };

/** Idioma inicial: el elegido antes (localStorage) o, si no hay, el del navegador.
 *  localStorage puede fallar en modo privado o con cookies bloqueadas: nunca debe
 *  romper la página, solo perder la preferencia. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* almacenamiento no disponible: se usa el idioma del navegador */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2).toLowerCase() : "es";
  return isLang(nav) ? nav : "es";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* sin persistencia: el cambio aplica igual en esta sesión */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const locale = LOCALES[lang];
    const numberFmts = new Map<number, Intl.NumberFormat>();
    const pctFmts = new Map<number, Intl.NumberFormat>();
    const monthFmts = {
      long: new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }),
      short: new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }),
    };

    const n = (v: number, digits = 0) => {
      let fmt = numberFmts.get(digits);
      if (!fmt) {
        fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
        numberFmts.set(digits, fmt);
      }
      return fmt.format(v);
    };
    const p = (v: number, digits = 0) => {
      let fmt = pctFmts.get(digits);
      if (!fmt) {
        fmt = new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });
        pctFmts.set(digits, fmt);
      }
      return fmt.format(v / 100);
    };
    const month = (key: string, style: "long" | "short" = "long") => {
      const i = ALL_MONTHS.indexOf(key as (typeof ALL_MONTHS)[number]);
      // Día 15 en UTC: evita que la zona horaria del visitante mueva el mes.
      return i < 0 ? key : monthFmts[style].format(new Date(Date.UTC(2026, i, 15)));
    };

    return { lang, setLang, t: DICTS[lang], locale, n, p, month };
  }, [lang, setLang]);

  // El plano 3D se abre en otra pestaña y comparte la misma clave: si ahí se cambia el
  // idioma, esta pestaña lo adopta sin recargar.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && isLang(e.newValue)) setLangState(e.newValue);
    };
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTS[lang].meta.title;
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
