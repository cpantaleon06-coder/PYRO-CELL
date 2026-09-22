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
      <header className="mb-6">
        <h1 className="font-display font-semibold text-xl">Valorización de sargazo mediante pirólisis</h1>
        <p className="text-sm text-text-secondary mt-1">
          Simulación digital — OneAquaHealth IEEE Global Hackathon 2026
        </p>
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
