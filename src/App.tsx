import { useState } from "react";
import { EconomicPanel } from "./components/EconomicPanel";
import { EnergyPanel } from "./components/EnergyPanel";
import { MonitoringPanel } from "./components/MonitoringPanel";
import { SeasonalityBar } from "./components/SeasonalityBar";
import { ValidationPanel } from "./components/ValidationPanel";
import { ENERGY_CONSTANTS } from "./lib/constants";

function App() {
  // Temperatura de reactor: estado compartido, no local del panel energético. Es el único
  // punto de diseño que alimenta los dos módulos (calor de pirólisis en el energético,
  // rendimiento de biochar en el económico), así que vive aquí para que no puedan derivar.
  const [reactorTempC, setReactorTempC] = useState<number>(ENERGY_CONSTANTS.reactorDesignTempC);

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary font-body px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
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

      <SeasonalityBar />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <EnergyPanel reactorTempC={reactorTempC} onReactorTempChange={setReactorTempC} />
        <EconomicPanel reactorTempC={reactorTempC} />
      </div>

      <MonitoringPanel />

      <ValidationPanel />
    </div>
  );
}

export default App;
