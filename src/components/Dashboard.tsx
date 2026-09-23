import { useMemo, useState } from "react";
import { EconomicPanel } from "./EconomicPanel";
import { EnergyPanel } from "./EnergyPanel";
import { MonitoringPanel } from "./MonitoringPanel";
import { OperatingNarrative } from "./OperatingNarrative";
import { SeasonalityBar } from "./SeasonalityBar";
import { ValidationPanel } from "./ValidationPanel";
import {
  computeOperatingPoint,
  ENERGY_CONSTANTS,
  SEASONALITY_CONSTANTS,
  type YearType,
} from "../lib/constants";

// 2026, confirmado año récord por USF Sargassum Watch System
const YEAR_TYPE: YearType = "record";

export function Dashboard({ onBack }: { onBack: () => void }) {
  // Estado global de simulación. El mes y el colchón mandan sobre TODOS los módulos
  // (antes el mes vivía dentro de la barra de estacionalidad y no salía de ahí, y el
  // panel de monitoreo tenía un segundo selector de mes que lo contradecía).
  const [month, setMonth] = useState("Sep");
  const [bufferLevelKg, setBufferLevelKg] = useState<number>(SEASONALITY_CONSTANTS.bufferTargetKg);
  const [reactorTempC, setReactorTempC] = useState<number>(ENERGY_CONSTANTS.reactorDesignTempC);

  // Punto de operación del mes: traduce el ritmo del reactor a caudal real de planta.
  const op = useMemo(
    () => computeOperatingPoint(month, bufferLevelKg, YEAR_TYPE),
    [month, bufferLevelKg]
  );

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary font-body px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-text-secondary hover:text-accent transition-colors mb-2"
          >
            ← Volver al inicio
          </button>
          <h1 className="font-display font-semibold text-xl">Valorización de sargazo mediante pirólisis</h1>
          <p className="text-sm text-text-secondary mt-1">
            Simulación digital — OneAquaHealth IEEE Global Hackathon 2026
          </p>
        </div>
        {/* Plano 3D de la planta: página estática en public/, se abre aparte para no
            competir con el dashboard ni cargar Three.js en el bundle principal. */}
        <a
          href="/planta-3d.html"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-accent text-white font-display font-semibold text-sm rounded px-4 py-2 hover:opacity-90 transition-opacity"
        >
          Ver planta en 3D →
        </a>
      </header>

      <SeasonalityBar
        month={month}
        onMonthChange={setMonth}
        bufferLevelKg={bufferLevelKg}
        onBufferChange={setBufferLevelKg}
        op={op}
      />

      <OperatingNarrative month={month} bufferLevelKg={bufferLevelKg} reactorTempC={reactorTempC} op={op} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <EnergyPanel reactorTempC={reactorTempC} onReactorTempChange={setReactorTempC} op={op} />
        <EconomicPanel reactorTempC={reactorTempC} op={op} />
      </div>

      <MonitoringPanel month={month} />

      <ValidationPanel />
    </div>
  );
}
