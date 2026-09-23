import { useEffect, useRef, type ReactNode } from "react";

/** Landing de contexto: qué es PYRO-CELL, el problema, la misión, la visión y por dónde
 *  empezamos. Va antes del dashboard y del plano 3D para darles marco.
 *  Lenguaje visual: bauhaus (formas primarias, rejilla dura, tipografía en bloque)
 *  + retrofuturismo (horizonte en perspectiva, barrido de escaneo, mono), sobre la
 *  paleta del proyecto: cobalto, blanco papel y negro carbón. */
export function Landing({ onEnter }: { onEnter: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Aparición progresiva al hacer scroll.
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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="bg-carbon text-paper-ink">
      <Hero onEnter={onEnter} />
      <Problem />
      <Mission />
      <Pipeline />
      <Roadmap />
      <FinalCta onEnter={onEnter} />
    </div>
  );
}

/* ------------------------------ Hero ------------------------------ */

function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-carbon lp-scan">
      {/* Horizonte retrofuturista */}
      <div className="absolute inset-x-0 bottom-0 h-[46vh] overflow-hidden" aria-hidden>
        <div className="lp-horizon absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/45 to-transparent" />
      </div>

      {/* Sol cobalto */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full opacity-25 blur-[2px]"
        style={{ background: "radial-gradient(circle, #3f6dff 0%, #1a46c9 45%, transparent 70%)" }}
        aria-hidden
      />

      {/* Formas primarias bauhaus, agrupadas a la derecha para no pisar el texto */}
      <div className="absolute top-[15%] right-[8%] w-28 h-28 rounded-full border-4 border-accent-bright/70 lp-float hidden md:block" aria-hidden />
      <div
        className="absolute top-[44%] right-[21%] w-0 h-0 lp-spin-slow hidden md:block"
        style={{ borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderBottom: "44px solid #3f6dff" }}
        aria-hidden
      />
      <div
        className="absolute top-[58%] right-[7%] w-20 h-20 bg-paper-ink/85 lp-float hidden md:block"
        style={{ animationDelay: "1.4s" }}
        aria-hidden
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-24 min-h-screen flex flex-col">
        <nav className="flex items-center justify-between">
          <span className="font-data text-xs tracking-[0.3em] text-accent-bright">PYRO-CELL</span>
          <div className="flex gap-2">
            <a
              href="/planta-3d.html"
              className="text-xs font-display font-semibold px-3 py-2 rounded border border-paper-ink/25 text-paper-ink/90 hover:bg-paper-ink/10 transition-colors"
            >
              Planta 3D
            </a>
            <button
              onClick={onEnter}
              className="text-xs font-display font-semibold px-3 py-2 rounded bg-accent-bright text-white hover:opacity-90 transition-opacity"
            >
              Dashboard
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col justify-center">
          <p className="lp-rise font-data text-xs tracking-[0.25em] text-accent-bright mb-6">
            OneAquaHealth · IEEE GLOBAL HACKATHON 2026
          </p>

          <h1
            className="lp-rise font-display font-bold leading-[0.88] tracking-tight text-paper-ink"
            style={{ fontSize: "clamp(3rem, 11vw, 8.5rem)", animationDelay: "0.1s" }}
          >
            PYRO
            <span className="text-accent-bright">·</span>
            CELL
          </h1>

          <div className="lp-rise h-1.5 w-40 bg-accent-bright my-8" style={{ animationDelay: "0.2s" }} />

          <p
            className="lp-rise max-w-2xl text-lg md:text-xl leading-relaxed text-paper-ink/80"
            style={{ animationDelay: "0.3s" }}
          >
            Convertimos el sargazo que asfixia la costa del Caribe en{" "}
            <Hl>biochar</Hl>, <Hl>energía</Hl> y <Hl>agua tratada</Hl>, antes de que se
            descomponga en la orilla y contamine el agua de la que beben esas comunidades.
          </p>

          <div className="lp-rise flex flex-wrap gap-3 mt-10" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={onEnter}
              className="font-display font-semibold text-sm bg-accent-bright text-white rounded px-6 py-3.5 hover:opacity-90 transition-opacity"
            >
              Explorar la simulación →
            </button>
            <a
              href="/planta-3d.html"
              className="font-display font-semibold text-sm border border-paper-ink/30 text-paper-ink rounded px-6 py-3.5 hover:bg-paper-ink/10 transition-colors"
            >
              Recorrer la planta en 3D
            </a>
          </div>
        </div>

        <div className="lp-rise grid grid-cols-2 md:grid-cols-4 gap-px bg-paper-ink/15 border border-paper-ink/15" style={{ animationDelay: "0.55s" }}>
          <Metric value="1,500 kg" label="sargazo procesado al día" />
          <Metric value="161 kg" label="biochar producido al día" />
          <Metric value="+2.30 MJ/kg" label="superávit energético" />
          <Metric value="2023-2025" label="datos satelitales reales" />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-carbon px-5 py-5">
      <p className="font-display font-semibold text-xl text-accent-bright">{value}</p>
      <p className="text-xs text-paper-ink/55 mt-1 leading-snug">{label}</p>
    </div>
  );
}

function Hl({ children }: { children: ReactNode }) {
  return <span className="text-paper-ink font-medium">{children}</span>;
}

/* ---------------------------- El problema ---------------------------- */

function Problem() {
  return (
    <section className="bg-paper text-carbon py-28">
      <div className="max-w-5xl mx-auto px-6">
        <SectionTag n="01" text="EL PROBLEMA" dark />

        <h2 className="lp-reveal font-display font-bold text-4xl md:text-6xl leading-[0.95] tracking-tight mt-6 mb-10 max-w-3xl">
          El sargazo no es un problema de playa.
          <span className="block text-accent">Es un problema de agua potable.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="lp-reveal space-y-5 text-[15px] leading-relaxed text-carbon/75">
            <p>
              Cuando los mantos de sargazo se descomponen en la orilla generan hipoxia y
              eutrofización, liberan sulfuro de hidrógeno y lixivian arsénico y metales
              pesados hacia la columna de agua.
            </p>
            <p>
              La Península de Yucatán, donde cae la mayor parte de esta arribazón, se asienta
              sobre uno de los sistemas de acuífero kárstico más grandes del planeta.{" "}
              <strong className="text-carbon">No son dos cuerpos de agua separados.</strong>{" "}
              Ciudades como Tulum dependen casi exclusivamente de ese agua subterránea, y la
              misma red kárstica conecta el acuífero con la costa mediante descarga submarina
              en un sentido e intrusión salina en el otro.
            </p>
            <p>
              Lo que se pudre en la orilla está ligado, por hidrogeología documentada y no por
              metáfora, al agua dulce que esas comunidades beben.
            </p>
          </div>

          <div className="lp-reveal grid gap-px bg-carbon/12 border border-carbon/12 self-start">
            <Fact value="12.5 M t" label="sargazo estimado en el Atlántico, Caribe y Golfo (agosto 2026)" />
            <Fact value="76,000 t" label="removidas en Quintana Roo durante 2025" />
            <Fact value="3-4 meses" label="al año sin materia prima suficiente (dic-feb)" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-paper px-6 py-6">
      <p className="font-display font-bold text-3xl text-accent">{value}</p>
      <p className="text-sm text-carbon/60 mt-1.5 leading-snug">{label}</p>
    </div>
  );
}

/* ------------------------ Misión y visión ------------------------ */

function Mission() {
  return (
    <section className="bg-carbon text-paper-ink py-28 relative overflow-hidden">
      <div
        className="absolute -right-24 top-16 w-72 h-72 rounded-full border-[3px] border-accent-bright/25 lp-spin-slow"
        aria-hidden
      />
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <SectionTag n="02" text="MISIÓN Y VISIÓN" />

        <div className="grid md:grid-cols-2 gap-14 mt-8">
          <div className="lp-reveal">
            <div className="w-14 h-14 bg-accent-bright mb-6" aria-hidden />
            <h3 className="font-display font-bold text-3xl mb-4">Nuestra misión</h3>
            <p className="text-[15px] leading-relaxed text-paper-ink/70">
              Retirar la biomasa antes de que se descomponga es, en sí mismo, una intervención
              de protección del agua costera. Nuestra misión es hacer que esa retirada deje de
              ser una limpieza puntual y pagada a pérdida, y se vuelva una operación que se
              sostiene sola porque produce algo de valor.
            </p>
          </div>

          <div className="lp-reveal" style={{ transitionDelay: "0.12s" }}>
            <div className="w-14 h-14 rounded-full border-[5px] border-paper-ink mb-6" aria-hidden />
            <h3 className="font-display font-bold text-3xl mb-4">Nuestra visión</h3>
            <p className="text-[15px] leading-relaxed text-paper-ink/70">
              Una red de plantas costeras a lo largo del Caribe mexicano, y con el tiempo del
              resto de la cuenca y África occidental, donde quiera que el sargazo pelágico
              toque tierra: convirtiendo alga contaminada en energía limpia y en una segunda
              corriente de agua tratada.
            </p>
          </div>
        </div>

        <blockquote className="lp-reveal mt-16 border-l-4 border-accent-bright pl-6 max-w-3xl">
          <p className="font-display text-xl md:text-2xl leading-snug text-paper-ink">
            La autosuficiencia energética no es el objetivo. Es lo que hace que proteger el
            agua sea sostenible en el tiempo.
          </p>
        </blockquote>
      </div>
    </section>
  );
}

/* --------------------------- Cómo funciona --------------------------- */

const STAGES = [
  { n: "01", title: "Extracción mecánica", text: "Una centrífuga decantadora exprime el agua libre sin gastar calor. Del 82% al 60% de humedad.", figure: "square" },
  { n: "02", title: "Secado solar", text: "Invernadero pasivo de 35 m² más colectores de tubos evacuados. Del 60% al 20% de humedad.", figure: "triangle" },
  { n: "03", title: "Pirólisis", text: "Reactor híbrido CSP + syngas recirculado a 500 °C. Produce biochar, syngas y bio-aceite.", figure: "circle" },
  { n: "04", title: "Filtro de agua", text: "El biochar se reutiliza como medio adsorbente, con regeneración térmica en el mismo reactor.", figure: "bars" },
] as const;

function Pipeline() {
  return (
    <section className="bg-paper text-carbon py-28">
      <div className="max-w-5xl mx-auto px-6">
        <SectionTag n="03" text="CÓMO FUNCIONA" dark />
        <h2 className="lp-reveal font-display font-bold text-4xl md:text-5xl tracking-tight mt-6 mb-4">
          Cuatro etapas, un solo balance
        </h2>
        <p className="lp-reveal text-[15px] text-carbon/65 max-w-2xl mb-12">
          Cada constante del modelo está anclada a una fuente citada o marcada explícitamente
          como estimación propia. Nada se presenta como medido si no lo es.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-carbon/12 border border-carbon/12">
          {STAGES.map((s, i) => (
            <div key={s.n} className="lp-reveal bg-paper p-6" style={{ transitionDelay: `${i * 0.08}s` }}>
              <Figure kind={s.figure} />
              <p className="font-data text-xs text-accent mt-5">{s.n}</p>
              <h3 className="font-display font-semibold text-lg mt-1 mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed text-carbon/65">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="lp-reveal mt-10">
          <a
            href="/planta-3d.html"
            className="inline-block font-display font-semibold text-sm bg-carbon text-paper rounded px-6 py-3.5 hover:opacity-90 transition-opacity"
          >
            Ver estas etapas en el plano 3D →
          </a>
        </div>
      </div>
    </section>
  );
}

function Figure({ kind }: { kind: (typeof STAGES)[number]["figure"] }) {
  if (kind === "square") return <div className="w-12 h-12 bg-accent" aria-hidden />;
  if (kind === "circle") return <div className="w-12 h-12 rounded-full bg-accent" aria-hidden />;
  if (kind === "triangle")
    return (
      <div
        className="w-0 h-0"
        style={{ borderLeft: "24px solid transparent", borderRight: "24px solid transparent", borderBottom: "42px solid #1a46c9" }}
        aria-hidden
      />
    );
  return (
    <div className="flex items-end gap-1.5 h-12" aria-hidden>
      <span className="w-3 h-5 bg-accent" />
      <span className="w-3 h-9 bg-accent" />
      <span className="w-3 h-12 bg-accent" />
    </div>
  );
}

/* -------------------------- Cómo empezamos -------------------------- */

const PHASES = [
  { tag: "HECHO", done: true, title: "Simulación verificada", text: "Balance de masa y energía, modelo económico, estacionalidad, monitoreo con datos satelitales reales de Odatis y validación de reportes ciudadanos con IA explicable." },
  { tag: "SIGUIENTE", done: false, title: "Prueba de lixiviación", text: "Antes de tratar el biochar como filtro de agua validado hay que comprobar en laboratorio que su propio arsénico bioacumulado no regresa al agua que filtra." },
  { tag: "DESPUÉS", done: false, title: "Ingeniería de reactor", text: "Dimensionar volumen y tiempo de residencia reales para el caudal modelado, y el campo CSP con tratamiento de gases de regeneración." },
  { tag: "META", done: false, title: "Planta piloto costera", text: "Primera unidad en la costa de Quintana Roo, en un terreno de 60-80 m², operando con el colchón estacional que ya está modelado." },
] as const;

function Roadmap() {
  return (
    <section className="bg-carbon text-paper-ink py-28">
      <div className="max-w-5xl mx-auto px-6">
        <SectionTag n="04" text="POR DÓNDE EMPEZAMOS" />
        <h2 className="lp-reveal font-display font-bold text-4xl md:text-5xl tracking-tight mt-6 mb-4">
          Lo que ya existe y lo que falta
        </h2>
        <p className="lp-reveal text-[15px] text-paper-ink/60 max-w-2xl mb-12">
          Decimos esto en voz alta en vez de dejar que la escala de la oportunidad tape lo que
          todavía no está verificado.
        </p>

        <div className="space-y-px bg-paper-ink/12 border border-paper-ink/12">
          {PHASES.map((p, i) => (
            <div
              key={p.title}
              className="lp-reveal bg-carbon p-6 md:flex md:items-start md:gap-8"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="md:w-40 shrink-0 mb-3 md:mb-0">
                <span
                  className={`font-data text-[11px] tracking-widest px-2.5 py-1 rounded ${
                    p.done ? "bg-accent-bright text-white" : "border border-paper-ink/30 text-paper-ink/60"
                  }`}
                >
                  {p.tag}
                </span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed text-paper-ink/65 max-w-2xl">{p.text}</p>
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
    <section className="bg-accent text-white py-28 relative overflow-hidden">
      <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-white/10 lp-float" aria-hidden />
      <div className="absolute right-10 top-10 w-24 h-24 border-4 border-white/25 lp-spin-slow" aria-hidden />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <h2 className="lp-reveal font-display font-bold text-4xl md:text-6xl tracking-tight leading-[0.95] max-w-3xl">
          Mueve el mes, el colchón y la temperatura. Mira cómo responde la planta entera.
        </h2>
        <p className="lp-reveal text-white/80 text-[15px] mt-6 max-w-2xl leading-relaxed">
          El dashboard no es una maqueta: cada número sale del mismo módulo de constantes
          verificadas, y el monitoreo usa detección satelital real del Caribe mexicano.
        </p>
        <div className="lp-reveal flex flex-wrap gap-3 mt-10">
          <button
            onClick={onEnter}
            className="font-display font-semibold text-sm bg-white text-accent rounded px-7 py-4 hover:opacity-90 transition-opacity"
          >
            Entrar al dashboard →
          </button>
          <a
            href="/planta-3d.html"
            className="font-display font-semibold text-sm border border-white/50 text-white rounded px-7 py-4 hover:bg-white/10 transition-colors"
          >
            Ver la planta en 3D
          </a>
        </div>

        <p className="lp-reveal font-data text-xs text-white/50 mt-16 pt-6 border-t border-white/20">
          PYRO-CELL · OneAquaHealth IEEE Global Hackathon 2026
        </p>
      </div>
    </section>
  );
}

/* ---------------------------- Utilidades ---------------------------- */

function SectionTag({ n, text, dark }: { n: string; text: string; dark?: boolean }) {
  return (
    <div className="lp-reveal flex items-center gap-4">
      <span className={`h-1 w-12 ${dark ? "bg-accent" : "bg-accent-bright"}`} aria-hidden />
      <span className={`font-data text-xs tracking-[0.25em] ${dark ? "text-carbon/50" : "text-paper-ink/50"}`}>
        {n} — {text}
      </span>
    </div>
  );
}
