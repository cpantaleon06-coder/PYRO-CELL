import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../i18n/context";
import { fill } from "../i18n/format";
import {
  biocharYieldInterpolated,
  computeMassBalance,
  ENERGY_CONSTANTS,
  PLANT_REFERENCE,
  pyrolysisHeatAtDesignTemp,
  RIVER_PLASTIC_KG_PER_DAY,
  RIVER_PYRO_OIL_KG_PER_DAY,
  RIVER_STREAM,
} from "../lib/constants";
import { LangSwitch } from "./LangSwitch";

// Las cifras del hero y de las corrientes se derivan del mismo módulo de constantes que
// usa el dashboard, para que no puedan quedar desfasadas si cambia un valor de diseño.
// Se guardan como número y se formatean al pintar, según el idioma elegido.
const MASS = computeMassBalance(
  PLANT_REFERENCE.freshSargassumKgPerDay,
  PLANT_REFERENCE.initialMoisturePct,
  PLANT_REFERENCE.targetMoisturePctStage1,
  PLANT_REFERENCE.targetMoisturePctStage2
);
const DESIGN_T = ENERGY_CONSTANTS.reactorDesignTempC;
const FRESH_KG = PLANT_REFERENCE.freshSargassumKgPerDay;
const BIOCHAR_KG = biocharYieldInterpolated(DESIGN_T) * MASS.materiaSecaKg;
const SURPLUS_MJ = ENERGY_CONSTANTS.syngasBiocrudeYield - pyrolysisHeatAtDesignTemp(DESIGN_T);

/** Landing de contexto: qué es PYRO-CELL, el problema, la misión y por dónde empezamos.
 *  Va antes del dashboard y del plano 3D para darles marco.
 *
 *  Criterios de diseño: un solo ritmo de espaciado (py-24 / px-6 / gap-8), progresión
 *  tonal suave carbón → papel en vez de saltos duros, dos familias tipográficas, sin
 *  formas decorativas flotando encima del texto, e interlineado 1.5 heredado del body. */
export function Landing({ onEnter }: { onEnter: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll(".lp-reveal");
    if (!els?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={rootRef} className="bg-carbon text-paper-ink">
      <Hero onEnter={onEnter} />
      <Problem />
      <Mission />
      {/* Transición tonal: evita el corte duro entre el bloque oscuro y el claro */}
      <div className="h-48 bg-gradient-to-b from-carbon-soft via-carbon-soft/40 to-paper" aria-hidden />
      <Pipeline />
      <Platform />
      <Roadmap />
      <FinalCta onEnter={onEnter} />
    </main>
  );
}

/* ------------------------- Imagen del header ------------------------- */

/** Composición orgánica que alude a los mantos de sargazo a la deriva sobre el agua.
 *  Es arte vectorial generado, no una fotografía: no hay assets externos que cargar
 *  ni licencias que resolver, y acompaña sin competir con el texto. */
function OrganicHeader() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <radialGradient id="glow" cx="72%" cy="26%" r="46%">
            <stop offset="0%" stopColor="#3f6dff" stopOpacity="0.34" />
            <stop offset="60%" stopColor="#1a46c9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a46c9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="band1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a46c9" stopOpacity="0.62" />
            <stop offset="55%" stopColor="#3f6dff" stopOpacity="0.44" />
            <stop offset="100%" stopColor="#1a46c9" stopOpacity="0.56" />
          </linearGradient>
          <linearGradient id="band2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a55d6" stopOpacity="0.40" />
            <stop offset="50%" stopColor="#3f6dff" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#2a55d6" stopOpacity="0.38" />
          </linearGradient>
          <linearGradient id="band3" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3f6dff" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#3f6dff" stopOpacity="0.16" />
          </linearGradient>
          <filter id="soften" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <rect width="1440" height="800" fill="url(#glow)" />

        {/* Manchas de sargazo a la deriva, desenfocadas para dar profundidad */}
        <g filter="url(#soften)" className="lp-drift-3">
          <ellipse cx="300" cy="455" rx="128" ry="30" fill="#3f6dff" opacity="0.16" transform="rotate(-6 300 455)" />
          <ellipse cx="860" cy="430" rx="164" ry="34" fill="#3f6dff" opacity="0.13" transform="rotate(4 860 430)" />
          <ellipse cx="1220" cy="486" rx="110" ry="26" fill="#3f6dff" opacity="0.15" transform="rotate(-3 1220 486)" />
        </g>

        {/* Bandas orgánicas: agua y mantos en tres planos */}
        <g className="lp-drift-3">
          <path
            d="M-60,548 C160,512 320,566 500,540 C680,514 840,570 1020,544 C1200,518 1340,556 1500,534 L1500,820 L-60,820 Z"
            fill="url(#band3)"
          />
        </g>
        <g className="lp-drift-2">
          <path
            d="M-60,624 C180,588 350,648 530,620 C710,592 870,652 1050,626 C1230,600 1360,638 1500,616 L1500,820 L-60,820 Z"
            fill="url(#band2)"
          />
        </g>
        <g className="lp-drift-1">
          <path
            d="M-60,706 C200,674 390,730 570,702 C750,674 910,734 1090,706 C1270,678 1380,716 1500,698 L1500,820 L-60,820 Z"
            fill="url(#band1)"
          />
        </g>
      </svg>

      {/* El texto del hero va alineado a la izquierda, así que el velo es horizontal:
          opaco donde se lee, transparente donde vive la imagen. */}
      <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/80 to-carbon/20" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-carbon to-transparent" />
    </div>
  );
}

/* ------------------------------ Hero ------------------------------ */

function Hero({ onEnter }: { onEnter: () => void }) {
  const { t, n } = useI18n();
  const h = t.landing.hero;
  return (
    <section className="relative min-h-screen overflow-hidden bg-carbon">
      <OrganicHeader />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 min-h-screen flex flex-col">
        <header className="flex items-center justify-between gap-6 flex-wrap">
          <span className="font-display font-semibold text-sm tracking-[0.2em] text-accent-bright">
            PYRO-CELL
          </span>
          <nav className="flex items-center gap-3 flex-wrap">
            <LangSwitch tone="dark" />
            <a
              href="/planta-3d.html"
              className="text-sm font-display font-semibold px-4 py-2 rounded-none border border-paper-ink/25 text-paper-ink/90 hover:bg-paper-ink/10 transition-colors"
            >
              {t.landing.nav.plant3d}
            </a>
            <button
              onClick={onEnter}
              className="text-sm font-display font-semibold px-4 py-2 rounded-none bg-accent-bright text-white hover:opacity-90 transition-opacity"
            >
              {t.landing.nav.dashboard}
            </button>
          </nav>
        </header>

        <div className="flex-1 flex flex-col justify-center py-24">
          <p className="lp-rise text-sm tracking-[0.18em] text-accent-bright">
            OneAquaHealth · IEEE Global Hackathon 2026
          </p>

          <h1
            className="lp-rise font-display font-bold tracking-tight text-paper-ink mt-6"
            style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)", animationDelay: "0.1s" }}
          >
            PYRO<span className="text-accent-bright">·</span>CELL
          </h1>

          <p
            className="lp-rise max-w-xl text-lg text-paper-ink/75 mt-6"
            style={{ animationDelay: "0.2s" }}
          >
            {fill(h.lead, ...h.leadWords.map((w) => <Hl key={w}>{w}</Hl>))}
          </p>

          <div className="lp-rise flex flex-wrap gap-4 mt-12" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={onEnter}
              className="font-display font-semibold text-sm bg-accent-bright text-white rounded-none px-8 py-4 hover:opacity-90 transition-opacity"
            >
              {h.ctaSim}
            </button>
            <a
              href="/planta-3d.html"
              className="font-display font-semibold text-sm border border-paper-ink/30 text-paper-ink rounded-none px-8 py-4 hover:bg-paper-ink/10 transition-colors"
            >
              {h.cta3d}
            </a>
          </div>
        </div>

        <div className="lp-rise grid grid-cols-2 md:grid-cols-4 gap-8" style={{ animationDelay: "0.4s" }}>
          <Metric value={`${n(FRESH_KG)} kg`} label={h.metrics[0]} />
          <Metric value={`${n(BIOCHAR_KG)} kg`} label={h.metrics[1]} />
          <Metric value={`+${n(SURPLUS_MJ, 2)} MJ/kg`} label={h.metrics[2]} />
          <Metric value="2023–2025" label={h.metrics[3]} />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t-2 border-paper-ink/25 pt-4">
      <p className="font-display font-semibold text-xl text-accent-bright">{value}</p>
      <p className="text-sm text-paper-ink/55 mt-1">{label}</p>
    </div>
  );
}

function Hl({ children }: { children: ReactNode }) {
  return <span className="text-paper-ink font-medium">{children}</span>;
}

/* ---------------------------- El problema ---------------------------- */

function Problem() {
  const { t, n } = useI18n();
  const pr = t.landing.problem;
  return (
    <section className="bg-carbon-soft py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text={pr.eyebrow} />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-3xl">
          {pr.titleA}
          <span className="block text-accent-bright">{pr.titleB}</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="lp-reveal space-y-6 text-paper-ink/70">
            <p>{pr.p1}</p>
            <p>{pr.p2}</p>
          </div>

          <div className="lp-reveal grid gap-8 self-start">
            <Fact value={`${n(12.5, 1)} M t`} label={pr.facts[0]} />
            <Fact value={`${n(76_000)} t`} label={pr.facts[1]} />
            <Fact value={pr.monthsRange} label={pr.facts[2]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-4 border-accent-bright/60 pl-6">
      <p className="font-display font-bold text-2xl text-paper-ink">{value}</p>
      <p className="text-sm text-paper-ink/55 mt-1">{label}</p>
    </div>
  );
}

/* ------------------------ Misión y visión ------------------------ */

function Mission() {
  const { t } = useI18n();
  const mi = t.landing.mission;
  return (
    <section className="bg-carbon-soft py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text={mi.eyebrow} />

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="lp-reveal">
            <h3 className="font-display font-semibold text-2xl">{mi.missionTitle}</h3>
            <p className="text-paper-ink/70 mt-6">{mi.missionText}</p>
          </div>

          <div className="lp-reveal">
            <h3 className="font-display font-semibold text-2xl">{mi.visionTitle}</h3>
            <p className="text-paper-ink/70 mt-6">{mi.visionText}</p>
          </div>
        </div>

        <blockquote className="lp-reveal border-l-4 border-accent-bright pl-6 mt-12 max-w-2xl">
          <p className="font-display text-xl md:text-2xl text-paper-ink">{mi.quote}</p>
        </blockquote>
      </div>
    </section>
  );
}

/* --------------------------- Cómo funciona --------------------------- */

const seq = (i: number) => String(i + 1).padStart(2, "0");

function Pipeline() {
  const { t } = useI18n();
  const pl = t.landing.pipeline;
  return (
    <section className="bg-paper text-carbon py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text={pl.eyebrow} dark />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-2xl">
          {pl.title}
        </h2>
        <p className="lp-reveal text-carbon/65 mt-6 max-w-xl">{pl.intro}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {pl.stages.map((s, i) => (
            <div key={i} className="lp-reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
              <div className="h-3 w-3 bg-accent" aria-hidden />
              <p className="text-sm text-accent mt-6">{seq(i)}</p>
              <h3 className="font-display font-semibold text-lg mt-1">{s.title}</h3>
              <p className="text-sm text-carbon/65 mt-4">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="lp-reveal mt-12">
          <a
            href="/planta-3d.html"
            className="inline-block font-display font-semibold text-sm bg-carbon text-paper rounded-none px-8 py-4 hover:opacity-90 transition-opacity"
          >
            {pl.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Plataforma ---------------------------- */

/** Las cifras llevan el mismo rigor que el resto del proyecto: `kind` distingue
 *  especificación real de supuesto ilustrativo, y se muestra en la UI. Los valores salen
 *  de constants.ts; el texto de cada corriente, del diccionario del idioma activo. */
type FigureKind = "verified" | "realSpec" | "supported" | "assumption";
const STREAM_FIGURES: { value: number; kind: FigureKind }[][] = [
  [
    { value: FRESH_KG, kind: "verified" },
    { value: BIOCHAR_KG, kind: "verified" },
  ],
  [
    { value: RIVER_STREAM.interceptorKgPerDay, kind: "realSpec" },
    { value: RIVER_PLASTIC_KG_PER_DAY, kind: "supported" },
    { value: RIVER_PYRO_OIL_KG_PER_DAY, kind: "assumption" },
  ],
  // Residuos orgánicos: sin cifras porque no hay fuente que las respalde.
  [],
];

function Platform() {
  const { t, n } = useI18n();
  const pf = t.landing.platform;
  return (
    <section className="bg-paper text-carbon py-24 border-t border-carbon/15">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text={pf.eyebrow} dark />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-2xl">
          {pf.title}
        </h2>
        <p className="lp-reveal text-carbon/65 mt-6 max-w-xl">{pf.intro}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {pf.streams.map((st, i) => {
            const done = i === 0;
            const figures = STREAM_FIGURES[i] ?? [];
            return (
              <article
                key={i}
                className="lp-reveal border border-carbon/20 p-8"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display font-bold text-2xl text-accent">{seq(i)}</span>
                  <span
                    className={`text-xs font-display font-semibold uppercase tracking-[0.12em] px-3 py-1.5 ${
                      done ? "bg-accent text-white" : "border border-carbon/30 text-carbon/60"
                    }`}
                  >
                    {st.status}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-2xl mt-6">{st.title}</h3>
                <p className="text-carbon/65 mt-4">{st.text}</p>

                {figures.length > 0 ? (
                  <dl className="mt-8 divide-y divide-carbon/12 border-t border-carbon/12">
                    {figures.map((fig, j) => (
                      <div key={j} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-carbon/60">{st.figLabels[j]}</dt>
                        <dd className="text-right">
                          <span className="font-display font-semibold whitespace-nowrap">
                            {n(fig.value)} {pf.perDay}
                          </span>
                          <span className="block text-xs text-carbon/70 uppercase tracking-[0.1em]">
                            {pf.kinds[fig.kind]}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-8 border-t border-carbon/12 pt-4 text-sm text-carbon/70">{st.note}</p>
                )}
              </article>
            );
          })}
        </div>

        <div className="lp-reveal grid sm:grid-cols-2 gap-8 mt-12">
          <figure>
            <img
              src="/interceptor-rio.png"
              alt={pf.interceptorAlt}
              width={1298}
              height={713}
              loading="lazy"
              className="w-full border border-carbon/20 bg-carbon"
            />
            <figcaption className="text-sm text-carbon/70 mt-3">{pf.interceptorCaption}</figcaption>
          </figure>
          <figure>
            <img
              src="/planta-rio.png"
              alt={pf.plantAlt}
              width={1233}
              height={713}
              loading="lazy"
              className="w-full border border-carbon/20 bg-carbon"
            />
            <figcaption className="text-sm text-carbon/70 mt-3">{pf.plantCaption}</figcaption>
          </figure>
        </div>

        <p className="lp-reveal text-sm text-carbon/70 mt-8 max-w-3xl">{pf.caveat}</p>
      </div>
    </section>
  );
}

/* -------------------------- Cómo empezamos -------------------------- */

function Roadmap() {
  const { t } = useI18n();
  const rm = t.landing.roadmap;
  return (
    <section className="bg-paper text-carbon py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text={rm.eyebrow} dark />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-2xl">
          {rm.title}
        </h2>

        <div className="mt-12 space-y-8">
          {rm.phases.map((p, i) => (
            <div
              key={i}
              className="lp-reveal md:flex md:gap-8 border-t border-carbon/12 pt-8"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="md:w-36 shrink-0">
                <span
                  className={`inline-block text-xs font-display font-semibold uppercase tracking-[0.12em] px-3 py-1.5 ${
                    i === 0 ? "bg-accent text-white" : "border border-carbon/30 text-carbon/60"
                  }`}
                >
                  {p.tag}
                </span>
              </div>
              <div className="mt-4 md:mt-0">
                <h3 className="font-display font-semibold text-xl">{p.title}</h3>
                <p className="text-carbon/65 mt-4 max-w-2xl">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Cierre ------------------------------ */

function FinalCta({ onEnter }: { onEnter: () => void }) {
  const { t } = useI18n();
  const fc = t.landing.final;
  return (
    <section className="bg-paper py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="lp-reveal bg-accent text-white px-8 py-16 md:px-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight max-w-2xl">{fc.title}</h2>
          <p className="text-white/80 mt-6 max-w-xl">{fc.text}</p>
          <div className="flex flex-wrap gap-4 mt-12">
            <button
              onClick={onEnter}
              className="font-display font-semibold text-sm bg-white text-accent rounded-none px-8 py-4 hover:opacity-90 transition-opacity"
            >
              {fc.ctaDash}
            </button>
            <a
              href="/planta-3d.html"
              className="font-display font-semibold text-sm border border-white/50 text-white rounded-none px-8 py-4 hover:bg-white/10 transition-colors"
            >
              {fc.cta3d}
            </a>
          </div>
        </div>

        <footer className="lp-reveal flex flex-wrap items-center justify-between gap-4 mt-12">
          <p className="text-sm text-carbon/70">{fc.footer}</p>
          <a
            href="https://github.com/cpantaleon06-coder/PYRO-CELL"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-display font-semibold text-accent underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            {fc.repo}
          </a>
        </footer>
      </div>
    </section>
  );
}

/* ---------------------------- Utilidades ---------------------------- */

function Eyebrow({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <div className="lp-reveal flex items-center gap-3">
      <span className={`h-2.5 w-2.5 ${dark ? "bg-accent" : "bg-accent-bright"}`} aria-hidden />
      <p
        className={`text-xs font-display font-semibold uppercase tracking-[0.22em] ${
          dark ? "text-accent" : "text-accent-bright"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
