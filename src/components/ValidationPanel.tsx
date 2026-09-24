import { useState } from "react";
import { useI18n } from "../i18n/context";
import { f } from "../i18n/format";
import type { AIValidationOutput, CitizenObservationInput, Morphotype } from "../lib/constants";

const MORPHOTYPES: Morphotype[] = ["unknown", "S_natans_I", "S_natans_VIII", "S_fluitans_III"];
const MORPHOTYPE_NAMES: Record<Exclude<Morphotype, "unknown">, string> = {
  S_natans_I: "S. natans I",
  S_natans_VIII: "S. natans VIII",
  S_fluitans_III: "S. fluitans III",
};

// Ejemplo prellenado para demo: Playa del Carmen, temporada alta. La descripción viene
// del diccionario para que el ejemplo aparezca en el idioma elegido.
const DEFAULT_FIELDS = {
  estimatedTonnage: 12,
  gpsLocation: { lat: 20.63, lng: -87.07 },
  observedMorphotype: "unknown" as Morphotype,
};

type ReviewDecision = "approved" | "rejected" | null;

export function ValidationPanel() {
  const { t, lang } = useI18n();
  const v = t.dash.validate;

  // null = el usuario no ha tocado la descripción: se muestra la de ejemplo del idioma
  // activo, así cambia sola al cambiar de idioma en vez de quedarse en español.
  const [photo, setPhoto] = useState<string | null>(null);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [result, setResult] = useState<AIValidationOutput | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoDescription = photo ?? v.defaultPhoto;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setDecision(null);
    const input: CitizenObservationInput = { photoDescription, ...fields };
    try {
      const res = await fetch("/api/validate-observation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // lang: el modelo redacta explicación, razonamiento y anomalías en este idioma.
        body: JSON.stringify({ ...input, lang }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        // En local (npm run dev) la función Edge no corre; Vite responde el index.html.
        throw new Error(v.errNoEdge);
      }
      const data = (await res.json()) as AIValidationOutput & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? f(v.errStatus, res.status, res.statusText));
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm";

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <p className="font-display font-semibold text-base mb-1">{v.title}</p>
      <p className="text-xs text-text-muted mb-4">{v.subtitle}</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="md:col-span-2">
          <label htmlFor="obs-photo" className="text-xs text-text-secondary block mb-1">
            {v.photo}
          </label>
          <textarea
            id="obs-photo"
            value={photoDescription}
            onChange={(e) => setPhoto(e.target.value)}
            rows={2}
            className={`${input} resize-none`}
          />
        </div>
        <div>
          <label htmlFor="obs-tonnage" className="text-xs text-text-secondary block mb-1">
            {v.tonnage}
          </label>
          <input
            id="obs-tonnage"
            type="number"
            step="0.1"
            value={fields.estimatedTonnage}
            onChange={(e) => setFields({ ...fields, estimatedTonnage: Number(e.target.value) })}
            className={`${input} font-data`}
          />
        </div>
        <div>
          <label htmlFor="obs-morpho" className="text-xs text-text-secondary block mb-1">
            {v.morpho}
          </label>
          <select
            id="obs-morpho"
            value={fields.observedMorphotype}
            onChange={(e) => setFields({ ...fields, observedMorphotype: e.target.value as Morphotype })}
            className={input}
          >
            {MORPHOTYPES.map((m) => (
              <option key={m} value={m}>
                {m === "unknown" ? v.unknown : MORPHOTYPE_NAMES[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="obs-lat" className="text-xs text-text-secondary block mb-1">
            {v.lat}
          </label>
          <input
            id="obs-lat"
            type="number"
            step="0.0001"
            value={fields.gpsLocation.lat}
            onChange={(e) => setFields({ ...fields, gpsLocation: { ...fields.gpsLocation, lat: Number(e.target.value) } })}
            className={`${input} font-data`}
          />
        </div>
        <div>
          <label htmlFor="obs-lng" className="text-xs text-text-secondary block mb-1">
            {v.lng}
          </label>
          <input
            id="obs-lng"
            type="number"
            step="0.0001"
            value={fields.gpsLocation.lng}
            onChange={(e) => setFields({ ...fields, gpsLocation: { ...fields.gpsLocation, lng: Number(e.target.value) } })}
            className={`${input} font-data`}
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-display font-semibold text-sm rounded px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? v.submitting : v.submit}
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="border border-deficit-dim bg-deficit-dim/20 rounded px-4 py-3 text-sm text-text-secondary">
          {error}
        </div>
      )}

      {result && <ResultCard result={result} decision={decision} onDecision={setDecision} />}
    </div>
  );
}

function ResultCard({
  result,
  decision,
  onDecision,
}: {
  result: AIValidationOutput;
  decision: ReviewDecision;
  onDecision: (d: ReviewDecision) => void;
}) {
  const { t, p } = useI18n();
  const v = t.dash.validate;
  const pct = Math.round(result.confidenceScore * 100);
  const confAccent = pct >= 60 ? "text-surplus" : pct >= 40 ? "text-energy" : "text-deficit";

  return (
    <div className="border-t border-border pt-4 space-y-3" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{v.confidence}</span>
        <span className={`font-display font-semibold text-lg ${confAccent}`}>{p(pct)}</span>
      </div>

      <p className="text-sm text-text-primary">{result.explanation}</p>

      {result.anomalyFlags.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary mb-1">{v.anomalies}</p>
          <ul className="space-y-1">
            {result.anomalyFlags.map((flag, i) => (
              <li key={i} className="text-xs text-deficit flex gap-2">
                <span aria-hidden>▸</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.reasoning && (
        <details className="text-xs">
          <summary className="text-text-secondary cursor-pointer select-none">{v.reasoning}</summary>
          <p className="text-text-muted mt-2 whitespace-pre-line">{result.reasoning}</p>
        </details>
      )}

      {result.humanReviewRequired ? (
        <div className="border border-energy-dim bg-energy-dim/15 rounded px-4 py-3">
          <p className="text-sm text-energy font-medium mb-2">{v.needsReview}</p>
          {decision === null ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onDecision("approved")}
                className="flex-1 bg-surplus text-white font-display font-semibold text-sm rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                {v.approve}
              </button>
              <button
                type="button"
                onClick={() => onDecision("rejected")}
                className="flex-1 bg-deficit text-white font-display font-semibold text-sm rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                {v.reject}
              </button>
            </div>
          ) : (
            <p className={`text-sm font-medium ${decision === "approved" ? "text-surplus" : "text-deficit"}`}>
              {decision === "approved" ? v.approved : v.rejected}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-surplus font-medium">{v.autoApproved}</p>
      )}
    </div>
  );
}
