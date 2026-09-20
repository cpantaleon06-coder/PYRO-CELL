import { EconomicPanel } from "./components/EconomicPanel";
import { EnergyPanel } from "./components/EnergyPanel";
import { MonitoringPanel } from "./components/MonitoringPanel";
import { SeasonalityBar } from "./components/SeasonalityBar";
import { ValidationPanel } from "./components/ValidationPanel";

function App() {
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
        <EnergyPanel />
        <EconomicPanel />
      </div>

      <MonitoringPanel />

      <ValidationPanel />
    </div>
  );
}

export default App;
