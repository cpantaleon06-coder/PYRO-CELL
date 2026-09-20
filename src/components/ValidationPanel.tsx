import { useState } from "react";
import type { AIValidationOutput, CitizenObservationInput, Morphotype } from "../lib/constants";

const MORPHOTYPE_OPTIONS: { value: Morphotype; label: string }[] = [
  { value: "unknown", label: "Desconocido" },
  { value: "S_natans_I", label: "S. natans I" },
  { value: "S_natans_VIII", label: "S. natans VIII" },
  { value: "S_fluitans_III", label: "S. fluitans III" },
];

// Ejemplo prellenado para demo: Playa del Carmen, temporada alta.
const DEFAULT_INPUT: CitizenObservationInput = {
  photoDescription: "Franja de algas pardo-doradas de ~2 m de ancho sobre la arena, con vesículas y olor fuerte.",
  estimatedTonnage: 12,
  gpsLocation: { lat: 20.63, lng: -87.07 },
  observedMorphotype: "unknown",
};

type ReviewDecision = "aprobada" | "rechazada" | null;

export function ValidationPanel() {
  const [input, setInput] = useState<CitizenObservationInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<AIValidationOutput | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setDecision(null);
    try {
      const res = await fetch("/api/validate-observation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("application/json")) {
        // En local (npm run dev) la función Edge no corre; Vite responde el index.html.
        const detail = await res.text().catch(() => "");
        throw new Error(
          !ct.includes("application/json")
            ? "La función Edge no está disponible aquí. Despliega a Vercel con GROQ_API_KEY para probar la validación contra Groq."
            : `Error ${res.status}: ${detail.slice(0, 200)}`
        );
      }
      const data = (await res.json()) as AIValidationOutput & { error?: string };
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-5">
      <p className="font-display font-semibold text-base mb-1">Validación con IA (Track 3)</p>
      <p className="text-xs text-text-muted mb-4">
        Groq · llama-3.3-70b · flujo human-in-the-loop con explicabilidad
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="text-xs text-text-secondary block mb-1">Descripción de la foto</label>
          <textarea
            value={input.photoDescription}
            onChange={(e) => setInput({ ...input, photoDescription: e.target.value })}
            rows={2}
            className="w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Tonelaje estimado (t)</label>
          <input
            type="number"
            step="0.1"
            value={input.estimatedTonnage}
            onChange={(e) => setInput({ ...input, estimatedTonnage: Number(e.target.value) })}
            className="w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm font-data"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Morfotipo observado</label>
          <select
            value={input.observedMorphotype}
            onChange={(e) => setInput({ ...input, observedMorphotype: e.target.value as Morphotype })}
            className="w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm"
          >
            {MORPHOTYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Latitud</label>
          <input
            type="number"
            step="0.0001"
            value={input.gpsLocation.lat}
            onChange={(e) => setInput({ ...input, gpsLocation: { ...input.gpsLocation, lat: Number(e.target.value) } })}
            className="w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm font-data"
          />
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Longitud</label>
          <input
            type="number"
            step="0.0001"
            value={input.gpsLocation.lng}
            onChange={(e) => setInput({ ...input, gpsLocation: { ...input.gpsLocation, lng: Number(e.target.value) } })}
            className="w-full bg-bg-raised border border-border rounded px-2 py-1.5 text-sm font-data"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-water text-bg-deep font-display font-semibold text-sm rounded px-4 py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Validando con IA…" : "Validar observación"}
          </button>
        </div>
      </form>

      {error && (
        <div className="border border-deficit-dim bg-deficit-dim/20 rounded px-4 py-3 text-sm text-text-secondary">
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
  const pct = Math.round(result.confidenceScore * 100);
  const confAccent = pct >= 60 ? "text-surplus" : pct >= 40 ? "text-energy" : "text-deficit";

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Confianza del modelo</span>
        <span className={`font-display font-semibold text-lg ${confAccent}`}>{pct}%</span>
      </div>

      <p className="text-sm text-text-primary leading-relaxed">{result.explanation}</p>

      {result.anomalyFlags.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary mb-1">Anomalías detectadas</p>
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
          <summary className="text-text-secondary cursor-pointer select-none">Ver razonamiento paso a paso</summary>
          <p className="text-text-muted mt-2 leading-relaxed whitespace-pre-line">{result.reasoning}</p>
        </details>
      )}

      {result.humanReviewRequired && (
        <div className="border border-energy-dim bg-energy-dim/15 rounded px-4 py-3">
          <p className="text-sm text-energy font-medium mb-2">Requiere revisión humana</p>
          {decision === null ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDecision("aprobada")}
                className="flex-1 bg-surplus text-bg-deep font-display font-semibold text-sm rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                Aprobar
              </button>
              <button
                onClick={() => onDecision("rechazada")}
                className="flex-1 bg-deficit text-bg-deep font-display font-semibold text-sm rounded px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                Rechazar
              </button>
            </div>
          ) : (
            <p className={`text-sm font-medium ${decision === "aprobada" ? "text-surplus" : "text-deficit"}`}>
              Observación {decision} por revisor humano.
            </p>
          )}
        </div>
      )}

      {!result.humanReviewRequired && (
        <p className="text-sm text-surplus font-medium">
          Aprobada automáticamente — confianza suficiente y sin anomalías.
        </p>
      )}
    </div>
  );
}
