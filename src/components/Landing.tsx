import { useEffect, useRef, type ReactNode } from "react";

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
    <div ref={rootRef} className="bg-carbon text-paper-ink">
      <Hero onEnter={onEnter} />
      <Problem />
      <Mission />
      {/* Transición tonal: evita el corte duro entre el bloque oscuro y el claro */}
      <div className="h-48 bg-gradient-to-b from-carbon-soft via-carbon-soft/40 to-paper" aria-hidden />
      <Pipeline />
      <Roadmap />
      <FinalCta onEnter={onEnter} />
    </div>
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

      {/* El texto del hero va alineado a la izquierda, asi que el velo es horizontal:
          opaco donde se lee, transparente donde vive la imagen. */}
      <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/80 to-carbon/20" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-carbon to-transparent" />
    </div>
  );
}

/* ------------------------------ Hero ------------------------------ */

function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-carbon">
      <OrganicHeader />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 min-h-screen flex flex-col">
        <nav className="flex items-center justify-between gap-6">
          <span className="font-display font-semibold text-sm tracking-[0.2em] text-accent-bright">
            PYRO-CELL
          </span>
          <div className="flex gap-3">
            <a
              href="/planta-3d.html"
              className="text-sm font-display font-semibold px-4 py-2 rounded-md border border-paper-ink/25 text-paper-ink/90 hover:bg-paper-ink/10 transition-colors"
            >
              Planta 3D
            </a>
            <button
              onClick={onEnter}
              className="text-sm font-display font-semibold px-4 py-2 rounded-md bg-accent-bright text-white hover:opacity-90 transition-opacity"
            >
              Dashboard
            </button>
          </div>
        </nav>

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
            Convertimos el sargazo que asfixia la costa del Caribe en{" "}
            <Hl>biochar</Hl>, <Hl>energía</Hl> y <Hl>agua tratada</Hl>.
          </p>

          <div className="lp-rise flex flex-wrap gap-4 mt-12" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={onEnter}
              className="font-display font-semibold text-sm bg-accent-bright text-white rounded-md px-8 py-4 hover:opacity-90 transition-opacity"
            >
              Explorar la simulación
            </button>
            <a
              href="/planta-3d.html"
              className="font-display font-semibold text-sm border border-paper-ink/30 text-paper-ink rounded-md px-8 py-4 hover:bg-paper-ink/10 transition-colors"
            >
              Ver la planta en 3D
            </a>
          </div>
        </div>

        <div className="lp-rise grid grid-cols-2 md:grid-cols-4 gap-8" style={{ animationDelay: "0.4s" }}>
          <Metric value="1,500 kg" label="sargazo procesado al día" />
          <Metric value="161 kg" label="biochar producido al día" />
          <Metric value="+2.30 MJ/kg" label="superávit energético" />
          <Metric value="2023–2025" label="datos satelitales reales" />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t border-paper-ink/20 pt-4">
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
  return (
    <section className="bg-carbon-soft py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text="El problema" />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-3xl">
          El sargazo no es un problema de playa.
          <span className="block text-accent-bright">Es un problema de agua potable.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="lp-reveal space-y-6 text-paper-ink/70">
            <p>
              Al descomponerse en la orilla, los mantos de sargazo generan hipoxia y lixivian
              arsénico y metales pesados hacia el agua.
            </p>
            <p>
              La Península de Yucatán se asienta sobre un acuífero kárstico que conecta ese
              litoral con el agua subterránea de la que beben ciudades como Tulum. No son dos
              cuerpos de agua separados.
            </p>
          </div>

          <div className="lp-reveal grid gap-8 self-start">
            <Fact value="12.5 M t" label="sargazo estimado en el Atlántico y el Caribe, 2026" />
            <Fact value="76,000 t" label="removidas en Quintana Roo durante 2025" />
            <Fact value="3–4 meses" label="al año sin materia prima suficiente" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-2 border-accent-bright/50 pl-6">
      <p className="font-display font-bold text-2xl text-paper-ink">{value}</p>
      <p className="text-sm text-paper-ink/55 mt-1">{label}</p>
    </div>
  );
}

/* ------------------------ Misión y visión ------------------------ */

function Mission() {
  return (
    <section className="bg-carbon-soft py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text="Misión y visión" />

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="lp-reveal">
            <h3 className="font-display font-semibold text-2xl">Nuestra misión</h3>
            <p className="text-paper-ink/70 mt-6">
              Retirar la biomasa antes de que se descomponga ya es proteger el agua costera.
              Queremos que esa retirada deje de ser una limpieza a pérdida y se vuelva una
              operación que se sostiene sola.
            </p>
          </div>

          <div className="lp-reveal">
            <h3 className="font-display font-semibold text-2xl">Nuestra visión</h3>
            <p className="text-paper-ink/70 mt-6">
              Una red de plantas costeras en el Caribe mexicano, y con el tiempo en el resto
              de la cuenca, que convierta alga contaminada en energía limpia y agua tratada.
            </p>
          </div>
        </div>

        <blockquote className="lp-reveal border-l-2 border-accent-bright pl-6 mt-12 max-w-2xl">
          <p className="font-display text-xl md:text-2xl text-paper-ink">
            La autosuficiencia energética no es el objetivo. Es lo que hace sostenible
            proteger el agua.
          </p>
        </blockquote>
      </div>
    </section>
  );
}

/* --------------------------- Cómo funciona --------------------------- */

const STAGES = [
  { n: "01", title: "Extracción mecánica", text: "Una centrífuga exprime el agua libre sin gastar calor: del 82 % al 60 % de humedad." },
  { n: "02", title: "Secado solar", text: "Invernadero pasivo y colectores de tubos evacuados llevan el alga al 20 % de humedad." },
  { n: "03", title: "Pirólisis", text: "Reactor híbrido a 500 °C que produce biochar, syngas y bio-aceite." },
  { n: "04", title: "Filtro de agua", text: "El biochar se reutiliza como medio adsorbente, con regeneración en el mismo reactor." },
] as const;

function Pipeline() {
  return (
    <section className="bg-paper text-carbon py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text="Cómo funciona" dark />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-2xl">
          Cuatro etapas, un solo balance
        </h2>
        <p className="lp-reveal text-carbon/65 mt-6 max-w-xl">
          Cada constante está anclada a una fuente citada o marcada como estimación propia.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {STAGES.map((s, i) => (
            <div key={s.n} className="lp-reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
              <div className="h-1 w-10 bg-accent rounded-full" aria-hidden />
              <p className="text-sm text-accent mt-6">{s.n}</p>
              <h3 className="font-display font-semibold text-lg mt-1">{s.title}</h3>
              <p className="text-sm text-carbon/65 mt-4">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="lp-reveal mt-12">
          <a
            href="/planta-3d.html"
            className="inline-block font-display font-semibold text-sm bg-carbon text-paper rounded-md px-8 py-4 hover:opacity-90 transition-opacity"
          >
            Ver estas etapas en el plano 3D
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------- Cómo empezamos -------------------------- */

const PHASES = [
  { tag: "Hecho", done: true, title: "Simulación verificada", text: "Balance de masa y energía, modelo económico, estacionalidad, monitoreo con datos satelitales reales y validación con IA explicable." },
  { tag: "Siguiente", done: false, title: "Prueba de lixiviación", text: "Comprobar en laboratorio que el arsénico del propio sargazo no regresa al agua que filtra." },
  { tag: "Después", done: false, title: "Ingeniería de reactor", text: "Dimensionar volumen y tiempo de residencia reales, y el campo solar con tratamiento de gases." },
  { tag: "Meta", done: false, title: "Planta piloto costera", text: "Primera unidad en la costa de Quintana Roo, operando con el colchón estacional ya modelado." },
] as const;

function Roadmap() {
  return (
    <section className="bg-paper text-carbon py-24">
      <div className="max-w-5xl mx-auto px-6">
        <Eyebrow text="Por dónde empezamos" dark />

        <h2 className="lp-reveal font-display font-bold text-3xl md:text-5xl tracking-tight mt-6 max-w-2xl">
          Lo que ya existe y lo que falta
        </h2>

        <div className="mt-12 space-y-8">
          {PHASES.map((p, i) => (
            <div
              key={p.title}
              className="lp-reveal md:flex md:gap-8 border-t border-carbon/12 pt-8"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="md:w-36 shrink-0">
                <span
                  className={`inline-block text-sm font-display font-semibold px-3 py-1 rounded-full ${
                    p.done ? "bg-accent text-white" : "border border-carbon/25 text-carbon/60"
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
  return (
    <section className="bg-paper py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="lp-reveal bg-accent text-white rounded-2xl px-8 py-16 md:px-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight max-w-2xl">
            Mueve el mes y mira cómo responde la planta entera.
          </h2>
          <p className="text-white/80 mt-6 max-w-xl">
            Cada número sale del mismo módulo de constantes verificadas, y el monitoreo usa
            detección satelital real del Caribe mexicano.
          </p>
          <div className="flex flex-wrap gap-4 mt-12">
            <button
              onClick={onEnter}
              className="font-display font-semibold text-sm bg-white text-accent rounded-md px-8 py-4 hover:opacity-90 transition-opacity"
            >
              Entrar al dashboard
            </button>
            <a
              href="/planta-3d.html"
              className="font-display font-semibold text-sm border border-white/50 text-white rounded-md px-8 py-4 hover:bg-white/10 transition-colors"
            >
              Ver la planta en 3D
            </a>
          </div>
        </div>

        <p className="lp-reveal text-sm text-carbon/45 mt-12">
          PYRO-CELL · OneAquaHealth IEEE Global Hackathon 2026
        </p>
      </div>
    </section>
  );
}

/* ---------------------------- Utilidades ---------------------------- */

function Eyebrow({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <p
      className={`lp-reveal text-sm tracking-[0.18em] ${
        dark ? "text-accent" : "text-accent-bright"
      }`}
    >
      {text}
    </p>
  );
}
