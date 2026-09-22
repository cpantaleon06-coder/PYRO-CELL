# Esquema de Datos — Dashboard de Simulación Sargazo

Define la estructura de datos para los cuatro módulos del dashboard. Todo corre del lado del cliente excepto el módulo de IA (Track 3), que necesita una función ligera en Vercel. Cada constante está anclada a su fuente en el documento de investigación.

---

## 1. Módulo Energético (Milledge et al. 2015)

```typescript
interface EnergyConstants {
  pyrolysisHeatPerKgDry400C: 0.5;    // MJ/kg, cifra original de Milledge et al. (400°C, desde 20°C frío, sin precalentar) — YA NO es el valor de diseño, ver pyrolysisHeatAtDesignTemp()
  syngasBiocrudeYield: 2.9;          // MJ/kg, energía disponible del syngas+biocrudo (medido a 400°C, se usa también a 500°C como extrapolación, ver salvedad en PYRO_CELL.md)
  evaporationEnergyPerKgWater: 2.6;  // MJ/kg, evaporar agua a presión atmosférica desde 20°C (valor teórico, antes de aplicar eficiencia)
  centrifugeEnergyPerKgWater: 0.2;   // MJ/kg, deshidratación mecánica industrial
  humanSustainedPowerW: [75, 150];   // rango W, potencia humana sostenida
  greenhouseEfficiency: 0.50;        // decisión adoptada: el invernadero pasivo NO captura el 100% de la energía teórica de evaporación

  // Constantes físicas para derivar evaporationEnergyPerKgWater desde primeros principios
  // (permiten recalcular si Tamb cambia; el valor 2.6 ya las tiene incorporadas a Tamb=20°C)
  waterSpecificHeatKJPerKgK: 4.186;  // Cp del agua, constante física estándar, no requiere cita
  waterLatentHeatKJPerKg: 2257;      // Lv a presión atmosférica, constante física estándar
  sargassumSpecificHeatKJPerKgK: 1.3; // Cp del sargazo seco — Milledge et al. 2015 (la misma fuente de pyrolysisHeatPerKgDry400C)
  ambientTempC: 20;                  // Tamb usado por Milledge et al. 2015 en su cálculo original (sargazo frío, sin precalentar)
  preheatedTempC: 40;                // temperatura real de entrada al reactor en nuestro diseño (precalentado en Etapa 2), usar este valor, no ambientTempC, para el cálculo de diseño
  boilingTempC: 100;
  reactorDesignTempC: 500;           // decisión adoptada: punto de diseño dentro del rango 400-600°C, considerando dispersión de calor y efectividad <100%
}

// Calor de pirólisis como función de temperatura, no constante fija
// (esto conecta por fin el módulo energético con el reactionTempC del módulo económico,
// que antes estaban desconectados)
function pyrolysisHeatAtDesignTemp(
  reactorTempC: number = 500,       // usar reactorDesignTempC por default
  startTempC: number = 40           // usar preheatedTempC por default, NO ambientTempC (20)
): number {
  return (1.3 * (reactorTempC - startTempC)) / 1000; // MJ/kg
}
// A 400°C desde 40°C: 0.468 MJ/kg (nota: distinto de pyrolysisHeatPerKgDry400C=0.5, porque Milledge
// calculó desde 20°C frío, y nuestro diseño real precalienta a 40°C)
// A 500°C desde 40°C: 0.598 MJ/kg  <- valor de diseño actual
// A 600°C desde 40°C: 0.728 MJ/kg

// Rendimiento de biochar interpolado linealmente entre los dos únicos puntos medidos
// (Milledge 67.6% a 400°C, Cheatham 51.91% a 600°C) — NO hay dato medido a 500°C
function biocharYieldInterpolated(reactorTempC: number): number {
  const Y400 = 0.676, Y600 = 0.5191;
  const slope = (Y600 - Y400) / (600 - 400);
  return Y400 + slope * (reactorTempC - 400);
}
// A 500°C: 59.76% -> 161.3 kg/día de biochar (270 kg materia seca). Estimación propia, no citada.

interface EnergyInput {
  freshSargassumKg: number;          // entrada, kg húmedos
  initialMoisturePct: number;        // 82 (Cheatham et al. 2026, cifra oficial del proyecto, confirmada por constantes.mlx). 79.9 (Milledge et al. 2015) es de un estudio distinto, no usar como default
  targetMoisturePctStage1: number;   // default 60, salida de centrifugado
  targetMoisturePctStage2: number;   // default 20, salida de invernadero
  dryingMode: "solar_passive" | "solar_passive_plus_thermal" | "manual_pedal";
  centrifugeMode: "industrial_pv" | "pilot_human";
}

interface EnergyOutput {
  stage1WaterRemovedKg: number;      // = freshKg × (initMoist - targetMoist1) / (1 - targetMoist1) [ver nota balance]
  stage1EnergyRequiredMJ: number;
  stage2WaterRemovedKg: number;
  stage2EnergyRequiredMJ: number;    // = stage2WaterRemovedKg × evaporationEnergyPerKgWater / greenhouseEfficiency (0.50)
  pyrolysisEnergySurplusMJ: number;  // syngasBiocrudeYield - pyrolysisHeatAtDesignTemp(reactorDesignTempC, preheatedTempC), por kg seco
  netBalanceStatus: "surplus" | "deficit";
  greenhouseCoveragePct: number;     // energía pasiva disponible / energía necesaria CON eficiencia aplicada (déficit actual: 192.5/487.5 = 39.5% cobertura pasiva)
  thermalCollectorAreaNeededM2: number; // para cerrar el déficit, con la eficiencia del 50% ya incorporada — 89.4 m² con los valores de diseño actuales
}
```

**Nota de balance de materia** (verificada, usar para cualquier cálculo de masa/agua):
```
Agua total = freshKg × initialMoisturePct
Materia seca = freshKg × (1 - initialMoisturePct)  [constante en todas las etapas]
mwater = mdry × (Hi/(1-Hi) - Hf/(1-Hf))            [forma general, equivalente a lo anterior]
Salida etapa N = materiaSeca / (1 - targetMoistureN)
Agua removida etapa N = entrada etapa N - salida etapa N
```

**Balance térmico de secado** (para cualquier etapa que evapore agua):
```
Qsensible = mwater × waterSpecificHeatKJPerKgK × (boilingTempC - ambientTempC)
Qlatent = mwater × waterLatentHeatKJPerKg
Qdrying_theoretical = Qsensible + Qlatent   // ya incorporado en evaporationEnergyPerKgWater = 2.6 MJ/kg
Qdrying_actual = Qdrying_theoretical / greenhouseEfficiency   // decisión adoptada: SÍ aplica también al invernadero pasivo (0.50), no solo a secado mecánico activo — revierte la nota anterior de este documento
```

**HHV de productos de pirólisis, derivados** (no citados directamente del paper; despejados de los rendimientos de energía por kg de sargazo original × los rendimientos de masa, ambos de Milledge et al. 2015 a 400°C — verificar contra el texto original antes de citarlos como HHV crudos en el pitch; usarlos a 500-600°C es extrapolación, ver salvedad en PYRO_CELL.md):
```typescript
interface DerivedHHV {
  biocharHHVMJPerKg: 15.68;   // = 10.6 MJ/kg-sargazo / 0.676 rendimiento másico (a 400°C)
  biooilHHVMJPerKg: 23.0;     // = 2.6 MJ/kg-sargazo / 0.113 rendimiento másico (a 400°C)
  syngasHHVMJPerKg: 1.82;     // = 0.3 MJ/kg-sargazo / 0.165 rendimiento másico (a 400°C)
}
// Enet_pyro = mdry × (Ybiochar×HHVbiochar + Ybiooil×HHVbiooil + Ysyngas×HHVsyngas) − Qpyro_req
// A 400°C daba pyrolysisEnergySurplusMJ = 2.4 MJ/kg; con el punto de diseño actual (500°C,
// precalentado a 40°C) el superávit es 2.302 MJ/kg — ver pyrolysisHeatAtDesignTemp() arriba
```

---

## 2. Módulo Económico (Cheatham et al. 2026)

```typescript
interface EconomicConstants {
  capitalCostUSD: 250015;
  annualManufacturingCostUSD: 4_830_000;
  npv12yrUSD: 9_620_000;
  breakevenYear: 5;
  baselineAcquisitionCostPerTon: 2;   // USD, supuesto del estudio
  baselineBiocharPriceUSDPerTon: 100; // usado para comparación
}

interface EconomicInput {
  dailyTonnage: number;               // default 1.5 (planta de referencia) o 1525.5 (escala del paper)
  acquisitionCostPerTon: number;      // slider: -25 (tarifa cobrada) a +25 (costo pagado)
  reactionTempC: number;              // rango de sensibilidad de Cheatham et al. es 400-800, pero el rango de DISEÑO del proyecto es 400-600, default 500 (ver EnergyConstants.reactorDesignTempC) — mover este slider debe recalcular también pyrolysisHeatAtDesignTemp() y biocharYieldInterpolated() en el módulo energético, antes estaban desconectados
  seasonalOperationMode: "full_year_buffered" | "reduced_rate_low_season";
}

interface EconomicOutput {
  breakevenPriceUSDPerTon: number;    // interpolado: $17.20 a $343.68 según acquisitionCostPerTon
  estimatedNPV: number;
  estimatedPaybackYear: number;
}
```

**Fórmula de interpolación del precio de equilibrio** — Cheatham et al. 2026 reportó solo tres escenarios (no una fórmula continua). Este es un ajuste cuadrático propio que pasa exactamente por esos tres puntos, para que el slider del wireframe tenga una salida continua:

```typescript
function breakevenPrice(acquisitionCostPerTon: number): number {
  // Ajuste cuadrático a los 3 puntos de Cheatham et al. 2026: (-25, 17.20), (2, 99.82), (25, 343.68)
  const a = 0.150853, b = 6.5296, c = 86.1574;
  const x = acquisitionCostPerTon;
  return a * x * x + b * x + c;
}
// SALVEDAD para el pitch: esta curva es una interpolación nuestra entre los 3 escenarios que
// el estudio sí reportó, no la fórmula real de costos fijos/variables del paper. Válida solo
// dentro de x ∈ [-25, 25]; fuera de ese rango, marcar el resultado como extrapolación no verificada.
```

---

## 3. Módulo de Estacionalidad

```typescript
interface SeasonalityConstants {
  highSeasonMonths: ["Apr","May","Jun","Jul","Aug","Sep","Oct"];
  lowSeasonMonths: ["Nov","Dec","Jan","Feb","Mar"];
  peakMonths: ["Jun","Jul"];
  bufferTargetDays: 49;               // 7 semanas, componente 2 de la resolución oficial
  bufferTargetKg: 16537.5;            // corregido: base de 337.5 kg/día (82% humedad), antes 18375 con base incorrecta de 80%
  bufferStorageM3: 82.7;              // corregido junto con bufferTargetKg
  bufferMoistureTargetPct: 10;        // base seca, umbral de estabilidad
}

interface SeasonalityInput {
  currentMonth: string;
  yearType: "record" | "normal" | "low";  // 2026 = record, per USF Sargassum Watch System
}

interface SeasonalityOutput {
  supplyStatus: "alta" | "baja" | "transicion";
  reactorRatePct: number;             // 100% temporada alta, reducido en núcleo duro (ene-feb)
  bufferLevelKg: number;
}
```

**Regla mes → ritmo del reactor** — no existe en la literatura revisada; es una heurística de diseño propia, consistente con la resolución oficial de estacionalidad (secar a menor humedad + colchón parcial + reactor a ritmo reducido, no en pausa total). Declárala como tal en el pitch:

```typescript
const coreScarcityMonths = ["Jan", "Feb"];        // núcleo duro, mínima llegada fresca
const transitionMonths = ["Nov", "Dec", "Mar"];   // llegada reducida pero no nula

function getReactorStatus(
  month: string,
  bufferLevelKg: number,
  bufferTargetKg: number,
  yearType: "record" | "normal" | "low"
): SeasonalityOutput {
  const bufferRatio = Math.min(bufferLevelKg / bufferTargetKg, 1);
  const yearAdjustment = yearType === "record" ? 10 : yearType === "low" ? -10 : 0;

  if (!transitionMonths.includes(month) && !coreScarcityMonths.includes(month)) {
    // temporada alta (abr-oct)
    return { supplyStatus: "alta", reactorRatePct: 100, bufferLevelKg };
  }
  if (transitionMonths.includes(month)) {
    const rate = Math.min(100, 70 + yearAdjustment);
    return { supplyStatus: "transicion", reactorRatePct: rate, bufferLevelKg };
  }
  // núcleo duro (ene-feb): depende casi enteramente del colchón
  const rate = Math.min(100, 20 + 80 * bufferRatio + yearAdjustment);
  return { supplyStatus: "baja", reactorRatePct: rate, bufferLevelKg };
}
// Piso de 20% en núcleo duro con colchón vacío (operación mínima, no cero) y techo de 100%
// con colchón lleno. El ajuste por yearType usa el dato ya confirmado de que 2026 es año récord,
// pero el tamaño del ajuste (±10 puntos) es arbitrario, no derivado de ningún estudio.
```

---

## 4. Módulo de Validación IA (Track 3) — requiere backend ligero

```typescript
// Vercel Edge Function, llama Claude API
interface CitizenObservationInput {
  photoDescription: string;
  estimatedTonnage: number;
  gpsLocation: { lat: number; lng: number };
  observedMorphotype?: "S_natans_I" | "S_natans_VIII" | "S_fluitans_III" | "unknown";
}

interface AIValidationOutput {
  confidenceScore: number;            // 0-1
  anomalyFlags: string[];
  explanation: string;                // explicabilidad requerida por el track
  humanReviewRequired: boolean;
}
```

---

## 5. Módulo de Monitoreo (Track 6)

**Decisión revisada (Fase 1, cerrada):** arquitectura híbrida de dos capas, no sintético puro. SaWS (USF) se descarta como fuente, no por preferencia sino porque no es técnicamente viable: no es una API, entrega imágenes satelitales del índice de algas flotantes vía un visor de calendario, y convertir eso en una cifra de toneladas exigiría un pipeline de visión por computadora completo, fuera de alcance en el tiempo disponible.

**Capa 1 — Histórico real:** muestra descargada offline (antes del hackathon, no en vivo) del dataset diario de detección de sargazo por satélite de Météo-France/CNES, disponible en NetCDF vía Odatis (DOI 10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d, 2018-presente), convertida a JSON/CSV ligero para la región del Caribe mexicano y empaquetada como archivo estático en la app.

**Capa 2 — Proyección sintética:** modelo estacional calibrado contra ese histórico real, usando el patrón ya establecido (temporada marzo-octubre, pico junio-julio, ver `SeasonalityConstants`), para fechas futuras o huecos de cobertura satelital.

Ninguna capa depende de una llamada de red en vivo durante la demo — la app nunca puede fallar por caída de una fuente externa.

```typescript
interface MonitoringInput {
  historicalBloomDataSource: "odatis_offline_snapshot" | "seasonal_projection";
  alertThresholdTons: number;
}

interface MonitoringOutput {
  currentProjectionTons: number;
  dataSourceUsed: "real" | "proyectado";   // cual capa produjo el valor mostrado
  alertLevel: "verde" | "amarillo" | "rojo";
  daysToThreshold: number | null;
}
```

---

## Fuentes de cada constante

| Constante | Valor | Fuente |
| --- | --- | --- |
| pyrolysisHeatPerKgDry400C, syngasBiocrudeYield, evaporationEnergyPerKgWater | 0.5, 2.9, 2.6 MJ/kg | Milledge et al. 2015, DOI 10.5539/enrr.v5n1p28 (a 400°C) |
| centrifugeEnergyPerKgWater | 0.2 MJ/kg | Patentes USPTO de deshidratación de biomasa/lodos |
| capitalCostUSD, annualManufacturingCostUSD, breakeven | Cheatham et al. 2026, DOI 10.3390/pr14152403 |
| bufferTargetDays, bufferTargetKg | Resolución oficial de estacionalidad (sección 14 del research doc) |
| bufferMoistureTargetPct | Estudio de isotermas de sorción, sea cucumber (was.org) |
| waterSpecificHeatKJPerKgK, waterLatentHeatKJPerKg, boilingTempC | 4.186, 2257, 100 | Constantes físicas estándar, no requieren cita académica |
| sargassumSpecificHeatKJPerKgK, ambientTempC | 1.3, 20 | Milledge et al. 2015 (mismos valores usados para pyrolysisHeatPerKgDry400C) |
| biocharHHVMJPerKg, biooilHHVMJPerKg, syngasHHVMJPerKg | 15.68, 23.0, 1.82 | **Derivados**, no citados directamente — despejados de Milledge et al. 2015 a 400°C, verificar contra el texto original antes de usarlos como HHV crudos |
| breakevenPrice(x) cuadrática | a=0.150853, b=6.5296, c=86.1574 | **Ajuste propio** a los 3 puntos de Cheatham et al. 2026, no es la fórmula del paper |
| getReactorStatus(month, buffer, yearType) | piso 20%, techo 100%, ±10 por yearType | **Heurística de diseño propia**, no validada en literatura |
| greenhouseEfficiency, reactorDesignTempC, preheatedTempC | 0.50, 500, 40 | **Decisiones de diseño propias** adoptadas por Carlo, no citadas de ningún estudio |
| biocharYieldInterpolated(500°C) = 59.76% | interpolación lineal | **Estimación propia**, entre Milledge (67.6% a 400°C) y Cheatham (51.91% a 600°C) — no hay dato medido a 500°C |
