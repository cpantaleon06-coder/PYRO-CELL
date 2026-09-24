// Constantes y fórmulas del pipeline de valorización de sargazo.
// Puerto directo de /esquema_datos.md, verificado con Python durante la investigación.
// Cada constante trae su fuente en el comentario. Las marcadas "decisión propia" o
// "estimación propia" no están tomadas de ningún estudio citado: son elecciones de
// diseño del proyecto y deben presentarse como tales.

import type { Lang } from "./lang";
import {
  MONTHLY_REFERENCE_DETECTION,
  WET_TONNES_PER_KM2_DETECTED,
  type MonthlyDetection,
} from "../data/sargassumReference";

export const ENERGY_CONSTANTS = {
  // Milledge et al. 2015, DOI 10.5539/enrr.v5n1p28 (medido a 400°C)
  pyrolysisHeatPerKgDry400C: 0.5, // MJ/kg, desde 20°C frío, SIN precalentar (cifra original del paper)
  syngasBiocrudeYield: 2.9, // MJ/kg, energía de syngas+biocrudo (medida a 400°C)
  evaporationEnergyPerKgWater: 2.6, // MJ/kg, teórico, antes de aplicar eficiencia

  // Patentes USPTO de deshidratación de biomasa/lodos
  centrifugeEnergyPerKgWater: 0.2, // MJ/kg

  // Wikipedia "Human power", ergonomía laboral
  humanSustainedPowerW: [75, 150] as const,

  // Decisión propia adoptada: el invernadero pasivo no captura el 100% de la
  // energía teórica de evaporación (pérdidas de transmisión, re-irradiación, convección)
  greenhouseEfficiency: 0.5,

  // Constantes físicas estándar (no requieren cita académica)
  waterSpecificHeatKJPerKgK: 4.186,
  waterLatentHeatKJPerKg: 2257,
  boilingTempC: 100,

  // Milledge et al. 2015 (mismos valores usados para pyrolysisHeatPerKgDry400C)
  sargassumSpecificHeatKJPerKgK: 1.3,
  ambientTempC: 20, // Tamb del cálculo original de Milledge (sargazo frío)

  // Diseño propio del proyecto
  preheatedTempC: 40, // temperatura real de entrada al reactor (precalentado en Etapa 2)
  reactorDesignTempC: 500, // punto de diseño dentro del rango 400-600°C
} as const;

export const HHV_DERIVED = {
  // Derivados, no citados directamente: despejados de Milledge et al. 2015 a 400°C
  // (MJ por kg de sargazo original) / (rendimiento másico) = MJ por kg de producto
  biocharHHVMJPerKg: 15.68, // = 10.6 / 0.676
  biooilHHVMJPerKg: 23.0, // = 2.6 / 0.113
  syngasHHVMJPerKg: 1.82, // = 0.3 / 0.165
} as const;

export const ECONOMIC_CONSTANTS = {
  // Cheatham et al. 2026, DOI 10.3390/pr14152403
  capitalCostUSD: 250_015,
  annualManufacturingCostUSD: 4_830_000,
  npv12yrUSD: 9_620_000,
  breakevenYear: 5,
  baselineAcquisitionCostPerTon: 2,
  baselineBiocharPriceUSDPerTon: 100,
} as const;

export const SEASONALITY_CONSTANTS = {
  highSeasonMonths: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"] as const,
  transitionMonths: ["Nov", "Dec", "Mar"] as const,
  coreScarcityMonths: ["Jan", "Feb"] as const,
  // Resolución oficial de estacionalidad (sección 14 del research doc), recalculada
  // con la base corregida de 337.5 kg/día de sargazo acondicionado (82% humedad)
  bufferTargetDays: 49,
  bufferTargetKg: 16_537.5,
  bufferStorageM3: 82.7,
  bufferMoistureTargetPct: 10, // base seca, umbral de estabilidad (isotermas de sorción)
} as const;

// ---------- Planta de referencia ----------
// Punto de operación único que comparten los módulos energético y económico, para que
// no puedan derivar entre sí (antes 1500 y 0.82 estaban como literales en EnergyPanel).
export const PLANT_REFERENCE = {
  freshSargassumKgPerDay: 1500, // PYRO_CELL.md, balance de materia
  initialMoisturePct: 0.82, // Cheatham et al. 2026 (NO 80%, ver corrección del balance)
  targetMoisturePctStage1: 0.6, // salida de centrifugado
  targetMoisturePctStage2: 0.2, // salida de invernadero
} as const;

// ---------- Balance de masa ----------

export interface MassBalance {
  materiaSecaKg: number;
  salidaEtapa1Kg: number;
  stage1WaterRemovedKg: number;
  salidaEtapa2Kg: number;
  stage2WaterRemovedKg: number;
}

/** mwater = mdry × (Hi/(1-Hi) - Hf/(1-Hf)), forma general del balance de materia */
export function computeMassBalance(
  freshSargassumKg: number,
  initialMoisturePct: number, // 0-1, default oficial 0.82 (Cheatham et al. 2026)
  targetMoisturePctStage1: number, // default 0.60
  targetMoisturePctStage2: number // default 0.20
): MassBalance {
  const materiaSecaKg = freshSargassumKg * (1 - initialMoisturePct);
  const salidaEtapa1Kg = materiaSecaKg / (1 - targetMoisturePctStage1);
  const stage1WaterRemovedKg = freshSargassumKg - salidaEtapa1Kg;
  const salidaEtapa2Kg = materiaSecaKg / (1 - targetMoisturePctStage2);
  const stage2WaterRemovedKg = salidaEtapa1Kg - salidaEtapa2Kg;
  return { materiaSecaKg, salidaEtapa1Kg, stage1WaterRemovedKg, salidaEtapa2Kg, stage2WaterRemovedKg };
}

// ---------- Balance de energía ----------

export interface EnergyBalance {
  stage1EnergyRequiredMJ: number;
  stage2EnergyTheoreticalMJ: number;
  stage2EnergyRequiredMJ: number; // con greenhouseEfficiency aplicada
  greenhousePassiveKWh: number;
  stage2DeficitKWh: number;
  thermalCollectorAreaM2: number;
  pyrolysisHeatRequiredMJPerKg: number;
  pyrolysisEnergySurplusMJPerKg: number;
  pyrolysisEnergySurplusTotalMJ: number;
  netBalanceStatus: "surplus" | "deficit";
}

/** Calor de pirólisis como función de temperatura, no constante fija.
 *  Conecta el módulo energético con reactionTempC del módulo económico. */
export function pyrolysisHeatAtDesignTemp(
  reactorTempC: number = ENERGY_CONSTANTS.reactorDesignTempC,
  startTempC: number = ENERGY_CONSTANTS.preheatedTempC
): number {
  return (ENERGY_CONSTANTS.sargassumSpecificHeatKJPerKgK * (reactorTempC - startTempC)) / 1000; // MJ/kg
}

/** Rendimiento de biochar interpolado linealmente entre los dos únicos puntos medidos
 *  (Milledge 67.6% a 400°C, Cheatham 51.91% a 600°C). Estimación propia, no citada. */
export function biocharYieldInterpolated(reactorTempC: number): number {
  const Y400 = 0.676;
  const Y600 = 0.5191;
  const slope = (Y600 - Y400) / (600 - 400);
  return Y400 + slope * (reactorTempC - 400);
}

const GREENHOUSE_AREA_M2 = 35;
const SOLAR_IRRADIANCE_KWH_M2_DAY = 5.5; // Quintana Roo, franja costera
const THERMAL_COLLECTOR_UTILIZATION = 0.6;

export function computeEnergyBalance(mass: MassBalance, reactorTempC: number): EnergyBalance {
  const stage1EnergyRequiredMJ = mass.stage1WaterRemovedKg * ENERGY_CONSTANTS.centrifugeEnergyPerKgWater;

  const stage2EnergyTheoreticalMJ = mass.stage2WaterRemovedKg * ENERGY_CONSTANTS.evaporationEnergyPerKgWater;
  const stage2EnergyRequiredMJ = stage2EnergyTheoreticalMJ / ENERGY_CONSTANTS.greenhouseEfficiency;

  const greenhousePassiveKWh = GREENHOUSE_AREA_M2 * SOLAR_IRRADIANCE_KWH_M2_DAY;
  const stage2RequiredKWh = stage2EnergyRequiredMJ / 3.6;
  const stage2DeficitKWh = Math.max(0, stage2RequiredKWh - greenhousePassiveKWh);
  const thermalCollectorAreaM2 = stage2DeficitKWh / (SOLAR_IRRADIANCE_KWH_M2_DAY * THERMAL_COLLECTOR_UTILIZATION);

  const pyrolysisHeatRequiredMJPerKg = pyrolysisHeatAtDesignTemp(reactorTempC);
  const pyrolysisEnergySurplusMJPerKg = ENERGY_CONSTANTS.syngasBiocrudeYield - pyrolysisHeatRequiredMJPerKg;
  const pyrolysisEnergySurplusTotalMJ = pyrolysisEnergySurplusMJPerKg * mass.materiaSecaKg;

  return {
    stage1EnergyRequiredMJ,
    stage2EnergyTheoreticalMJ,
    stage2EnergyRequiredMJ,
    greenhousePassiveKWh,
    stage2DeficitKWh,
    thermalCollectorAreaM2,
    pyrolysisHeatRequiredMJPerKg,
    pyrolysisEnergySurplusMJPerKg,
    pyrolysisEnergySurplusTotalMJ,
    netBalanceStatus: pyrolysisEnergySurplusMJPerKg >= 0 ? "surplus" : "deficit",
  };
}

// ---------- Módulo económico ----------

/** Ajuste cuadrático propio a los 3 escenarios de Cheatham et al. 2026:
 *  (-25, 17.20), (2, 99.82), (25, 343.68). No es la fórmula real del paper.
 *  Válido solo dentro de x ∈ [-25, 25]; fuera de ese rango se recorta (clamp)
 *  y debe marcarse como extrapolación en la UI (ver isBreakevenExtrapolated). */
export function breakevenPrice(acquisitionCostPerTon: number): number {
  const a = 0.150853;
  const b = 6.5296;
  const c = 86.1574;
  const x = Math.max(-25, Math.min(25, acquisitionCostPerTon));
  return a * x * x + b * x + c;
}

export function isBreakevenExtrapolated(acquisitionCostPerTon: number): boolean {
  return acquisitionCostPerTon < -25 || acquisitionCostPerTon > 25;
}

// ---------- Módulo de estacionalidad ----------

export type SupplyStatus = "alta" | "baja" | "transicion";
export type YearType = "record" | "normal" | "low";

export interface SeasonalityResult {
  supplyStatus: SupplyStatus;
  reactorRatePct: number;
}

/** Heurística de diseño propia, no validada en literatura para sargazo. */
export function getReactorStatus(
  month: string,
  bufferLevelKg: number,
  bufferTargetKg: number,
  yearType: YearType
): SeasonalityResult {
  const bufferRatio = Math.min(bufferLevelKg / bufferTargetKg, 1);
  const yearAdjustment = yearType === "record" ? 10 : yearType === "low" ? -10 : 0;

  const isTransition = (SEASONALITY_CONSTANTS.transitionMonths as readonly string[]).includes(month);
  const isCoreScarcity = (SEASONALITY_CONSTANTS.coreScarcityMonths as readonly string[]).includes(month);

  if (!isTransition && !isCoreScarcity) {
    return { supplyStatus: "alta", reactorRatePct: 100 };
  }
  if (isTransition) {
    return { supplyStatus: "transicion", reactorRatePct: Math.min(100, 70 + yearAdjustment) };
  }
  return { supplyStatus: "baja", reactorRatePct: Math.min(100, 20 + 80 * bufferRatio + yearAdjustment) };
}

// ---------- Punto de operación estacional ----------
// Aplica la heurística de estacionalidad al caudal nominal de la planta: si el reactor
// opera al X% de su ritmo, la línea procesa el X% de los 1,500 kg/día nominales. Es la
// aplicación directa del Componente 3 de la resolución de estacionalidad (reactor a
// ritmo reducido durante la escasez, NO en pausa total), no un modelo nuevo.

export interface OperatingPoint {
  supplyStatus: SupplyStatus;
  reactorRatePct: number;
  nominalKgPerDay: number; // caudal de diseño, 1,500 kg/día
  freshKgPerDay: number; // caudal real de este mes
  deltaVsNominalPct: number; // 0 en temporada alta, negativo al operar reducido
}

export function computeOperatingPoint(
  month: string,
  bufferLevelKg: number,
  yearType: YearType
): OperatingPoint {
  const { supplyStatus, reactorRatePct } = getReactorStatus(
    month,
    bufferLevelKg,
    SEASONALITY_CONSTANTS.bufferTargetKg,
    yearType
  );
  const nominalKgPerDay = PLANT_REFERENCE.freshSargassumKgPerDay;
  const freshKgPerDay = (nominalKgPerDay * reactorRatePct) / 100;
  return {
    supplyStatus,
    reactorRatePct,
    nominalKgPerDay,
    freshKgPerDay,
    deltaVsNominalPct: ((freshKgPerDay - nominalKgPerDay) / nominalKgPerDay) * 100,
  };
}

export const ALL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// ---------- Módulo de validación IA (Track 3) ----------
// Interfaces del esquema (esquema_datos.md §4). El campo `reasoning` es una extensión
// propia: el modelo razona paso a paso y devolvemos ese rastro como explicabilidad
// adicional del track. `explanation` sigue siendo el resumen en lenguaje llano.

export type Morphotype = "S_natans_I" | "S_natans_VIII" | "S_fluitans_III" | "unknown";

export interface CitizenObservationInput {
  photoDescription: string;
  estimatedTonnage: number;
  gpsLocation: { lat: number; lng: number };
  observedMorphotype?: Morphotype;
}

export interface AIValidationOutput {
  confidenceScore: number; // 0-1
  anomalyFlags: string[];
  explanation: string; // explicabilidad requerida por el track
  humanReviewRequired: boolean;
  reasoning?: string; // razonamiento paso a paso del modelo (extensión propia)
}

// Cajas delimitadoras aproximadas de las zonas de sargazo conocidas.
// Heurística de diseño propia — límites de orden geográfico, NO una capa oficial.
// Fuente de las regiones: PYRO_CELL.md (Caribe mexicano / Golfo de México; se excluye
// el Pacífico por ser otra cuenca oceánica sin sargazo pelágico del Atlántico).
export const SARGASSUM_ZONES = {
  caribeMexicano: { latMin: 17.8, latMax: 21.6, lngMin: -88.0, lngMax: -86.0 }, // costa de Quintana Roo
  golfoDeMexico: { latMin: 18.0, latMax: 30.5, lngMin: -97.5, lngMax: -88.0 },
} as const;

/** Rango plausible de tonelaje para UNA observación ciudadana puntual de playa.
 *  Heurística propia; un solo reporte difícilmente cae fuera de esta banda. */
export const PLAUSIBLE_TONNAGE_RANGE = { min: 0.01, max: 2000 } as const;

export function isWithinSargassumZone(lat: number, lng: number): boolean {
  return Object.values(SARGASSUM_ZONES).some(
    (z) => lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax
  );
}

/** Banderas de anomalía deterministas, calculadas sin el modelo. Sirven como red de
 *  seguridad: se pasan al modelo como pistas y se fusionan con su salida, de modo que
 *  un tonelaje absurdo o una ubicación fuera de zona siempre queden marcados. */
/** Textos de las banderas deterministas por idioma. Viven aquí (y no en los diccionarios
 *  de UI) porque las genera la función Edge, que no debe cargar esos diccionarios. */
const FLAG_TEXT: Record<
  Lang,
  { invalidTonnage: string; tonnageRange: string; invalidGps: string; outOfZone: string }
> = {
  es: {
    invalidTonnage: "Tonelaje reportado inválido (debe ser un número positivo).",
    tonnageRange: "Tonelaje ({0} t) fuera del rango plausible [{1}, {2}] t para una observación puntual.",
    invalidGps: "Coordenadas GPS inválidas o ausentes.",
    outOfZone: "Ubicación fuera de las zonas de sargazo conocidas (Caribe mexicano / Golfo de México).",
  },
  en: {
    invalidTonnage: "Invalid reported tonnage (must be a positive number).",
    tonnageRange: "Tonnage ({0} t) outside the plausible range [{1}, {2}] t for a single observation.",
    invalidGps: "Invalid or missing GPS coordinates.",
    outOfZone: "Location outside the known sargassum zones (Mexican Caribbean / Gulf of Mexico).",
  },
  fr: {
    invalidTonnage: "Tonnage déclaré invalide (doit être un nombre positif).",
    tonnageRange: "Tonnage ({0} t) hors de la plage plausible [{1}, {2}] t pour une observation ponctuelle.",
    invalidGps: "Coordonnées GPS invalides ou absentes.",
    outOfZone: "Emplacement hors des zones de sargasses connues (Caraïbes mexicaines / golfe du Mexique).",
  },
  pt: {
    invalidTonnage: "Tonelagem informada inválida (deve ser um número positivo).",
    tonnageRange: "Tonelagem ({0} t) fora da faixa plausível [{1}, {2}] t para uma observação pontual.",
    invalidGps: "Coordenadas GPS inválidas ou ausentes.",
    outOfZone: "Localização fora das zonas de sargaço conhecidas (Caribe mexicano / Golfo do México).",
  },
};

export function deterministicAnomalyFlags(input: CitizenObservationInput, lang: Lang = "es"): string[] {
  const text = FLAG_TEXT[lang];
  const flags: string[] = [];
  const { estimatedTonnage, gpsLocation } = input;

  if (!Number.isFinite(estimatedTonnage) || estimatedTonnage <= 0) {
    flags.push(text.invalidTonnage);
  } else if (estimatedTonnage < PLAUSIBLE_TONNAGE_RANGE.min || estimatedTonnage > PLAUSIBLE_TONNAGE_RANGE.max) {
    flags.push(
      text.tonnageRange
        .replace("{0}", String(estimatedTonnage))
        .replace("{1}", String(PLAUSIBLE_TONNAGE_RANGE.min))
        .replace("{2}", String(PLAUSIBLE_TONNAGE_RANGE.max))
    );
  }

  const { lat, lng } = gpsLocation ?? { lat: NaN, lng: NaN };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    flags.push(text.invalidGps);
  } else if (!isWithinSargassumZone(lat, lng)) {
    flags.push(text.outOfZone);
  }

  return flags;
}

// ---------- Corriente 02: Río-Limpieza (rio-limpieza.m) ----------
// Mismas cifras que el script de MATLAB, con el mismo grado de respaldo declarado ahí.
export const RIVER_STREAM = {
  interceptorKgPerDay: 50_000, // SPEC REAL: The Ocean Cleanup, Interceptor Original ("fully operational")
  plasticFraction: 0.7, // RESPALDADO: Benioff Ocean Science Lab (66 %) y río Krueng Aceh (77.8 %), redondeo conservador
  pyrolysisSplit: 0.5, // SUPUESTO ilustrativo: no hay caracterización del plástico recolectado
  pyrolysisOilYield: 0.65, // SUPUESTO: cifra típica de literatura, no medida en este proyecto
} as const;

export const RIVER_PLASTIC_KG_PER_DAY = RIVER_STREAM.interceptorKgPerDay * RIVER_STREAM.plasticFraction;
export const RIVER_PYRO_OIL_KG_PER_DAY =
  RIVER_PLASTIC_KG_PER_DAY * RIVER_STREAM.pyrolysisSplit * RIVER_STREAM.pyrolysisOilYield;

// ---------- Módulo de monitoreo (Track 6) ----------
// Arquitectura híbrida de dos capas (esquema_datos.md §5):
//   Capa 1 — histórico real: muestra offline de Odatis (MF-L3S-Sargassum-AFAI-OLCI),
//            ya descargada y convertida, ver src/data/sargassumReference.ts.
//   Capa 2 — proyección: modelo estacional calibrado contra ese histórico real.
//
// Nota de unidades: el satélite mide ÁREA de sargazo detectada (km²), no toneladas. La
// métrica principal es el área real; la toneladas es una conversión DERIVADA y estimada
// (ver WET_TONNES_PER_KM2_DETECTED). El esquema original (esquema_datos.md §5) hablaba de
// toneladas asumiendo una fuente que no existe como tal; aquí se conserva el tonelaje como
// estimación explícita sobre el dato real de área.

export type MonitoringDataSource = "odatis_offline_snapshot" | "seasonal_projection";
export type AlertLevel = "verde" | "amarillo" | "rojo";

export interface MonitoringInput {
  historicalBloomDataSource: MonitoringDataSource;
  alertThresholdAreaKm2: number;
}

export interface MonitoringOutput {
  currentAreaKm2: number; // medición satelital real (o proyección de la misma)
  currentEstimatedTons: number; // DERIVADO: área × WET_TONNES_PER_KM2_DETECTED (estimación)
  dataSourceUsed: "real" | "proyectado"; // cuál capa produjo el valor mostrado
  alertLevel: AlertLevel;
  daysToThreshold: number | null;
}

/** Convierte área detectada (km²) a toneladas húmedas estimadas. DERIVADO, no medido. */
export function areaToEstimatedTons(areaKm2: number): number {
  return areaKm2 * WET_TONNES_PER_KM2_DETECTED;
}

// Factor de ajuste de la proyección para año récord (2026, confirmado por USF Sargassum
// Watch System). Estimación propia, del mismo orden que el ajuste ±10% que ya usa
// getReactorStatus por yearType. No derivado de ningún estudio.
export const PROJECTION_RECORD_YEAR_FACTOR = 1.15;

// Umbrales de nivel de alerta relativos al umbral configurado. Heurística de diseño propia.
const ALERT_YELLOW_RATIO = 0.7; // amarillo a partir del 70% del umbral
const DAYS_PER_MONTH = 30.4; // aproximación para daysToThreshold

/** Serie mensual (12 meses, ene-dic) según la capa seleccionada.
 *  - odatis_offline_snapshot: la muestra real de Odatis tal cual.
 *  - seasonal_projection: la misma forma estacional real, escalada por el factor de año récord. */
export function monitoringMonthlySeries(source: MonitoringDataSource): MonthlyDetection[] {
  if (source === "odatis_offline_snapshot") {
    return MONTHLY_REFERENCE_DETECTION;
  }
  return MONTHLY_REFERENCE_DETECTION.map((m) => ({
    month: m.month,
    areaKm2: Math.round(m.areaKm2 * PROJECTION_RECORD_YEAR_FACTOR * 10) / 10,
    coveragePct: m.coveragePct,
  }));
}

function alertLevelFor(areaKm2: number, thresholdKm2: number): AlertLevel {
  if (areaKm2 >= thresholdKm2) return "rojo";
  if (areaKm2 >= thresholdKm2 * ALERT_YELLOW_RATIO) return "amarillo";
  return "verde";
}

/** Días hasta cruzar el umbral (en área), mirando hacia adelante desde `currentMonth` a lo
 *  largo de los próximos 12 meses (con envoltura al año siguiente). Aproximación en meses ×
 *  días/mes; `null` si no se cruza en el horizonte. */
function daysToThreshold(
  series: MonthlyDetection[],
  currentMonth: string,
  thresholdKm2: number
): number | null {
  const startIdx = ALL_MONTHS.indexOf(currentMonth as (typeof ALL_MONTHS)[number]);
  if (startIdx < 0) return null;
  for (let ahead = 0; ahead < 12; ahead++) {
    const m = series[(startIdx + ahead) % 12];
    if (m.areaKm2 >= thresholdKm2) {
      return Math.round(ahead * DAYS_PER_MONTH);
    }
  }
  return null;
}

export function computeMonitoring(input: MonitoringInput, currentMonth: string): MonitoringOutput {
  const series = monitoringMonthlySeries(input.historicalBloomDataSource);
  const startIdx = ALL_MONTHS.indexOf(currentMonth as (typeof ALL_MONTHS)[number]);
  const currentAreaKm2 = startIdx >= 0 ? series[startIdx].areaKm2 : 0;
  return {
    currentAreaKm2,
    currentEstimatedTons: Math.round(areaToEstimatedTons(currentAreaKm2)),
    dataSourceUsed: input.historicalBloomDataSource === "odatis_offline_snapshot" ? "real" : "proyectado",
    alertLevel: alertLevelFor(currentAreaKm2, input.alertThresholdAreaKm2),
    daysToThreshold: daysToThreshold(series, currentMonth, input.alertThresholdAreaKm2),
  };
}
