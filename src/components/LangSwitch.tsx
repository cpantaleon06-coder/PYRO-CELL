import { useI18n } from "../i18n/context";
import { LANGS } from "../lib/lang";

/** Selector de idioma segmentado. `tone` adapta el contraste al fondo:
 *  "dark" sobre carbón (landing), "light" sobre papel (dashboard). */
export function LangSwitch({ tone }: { tone: "dark" | "light" }) {
  const { lang, setLang, t } = useI18n();

  const frame = tone === "dark" ? "border-paper-ink/25" : "border-border";
  const idle =
    tone === "dark"
      ? "text-paper-ink/75 hover:bg-paper-ink/10"
      : "text-text-secondary hover:bg-bg-raised";
  const active = tone === "dark" ? "bg-accent-bright text-white" : "bg-accent text-white";

  return (
    <div role="group" aria-label={t.switcher.label} className={`inline-flex border ${frame}`}>
      {LANGS.map((code) => {
        const on = code === lang;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={t.switcher.names[code]}
            aria-label={t.switcher.names[code]}
            aria-pressed={on}
            onClick={() => setLang(code)}
            className={`min-w-9 px-2.5 py-2 text-xs font-display font-semibold uppercase tracking-[0.08em] transition-colors ${
              on ? active : idle
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
