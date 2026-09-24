// Idiomas de la interfaz. Vive aparte y sin dependencias porque lo importan tanto el
// cliente como la función Edge (api/validate-observation.ts), que no debe arrastrar
// los diccionarios de UI a su bundle.

export const LANGS = ["es", "en", "fr", "pt"] as const;
export type Lang = (typeof LANGS)[number];

/** Locale de Intl por idioma: decide separadores de miles, decimales y porcentaje. */
export const LOCALES: Record<Lang, string> = {
  es: "es-MX",
  en: "en-US",
  fr: "fr-FR",
  pt: "pt-BR",
};

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Clave compartida entre el dashboard (React) y planta-3d.html (estático), para que
 *  el idioma elegido en una página se mantenga al pasar a la otra. */
export const LANG_STORAGE_KEY = "pyrocell.lang";
