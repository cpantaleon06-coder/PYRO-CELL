// Dataset de monitoreo (Track 6), Capa 1 — MUESTRA REAL de Odatis (ya no placeholder).
//
// Fuente: producto "Daily composite of Sargassum detection derived from OLCI observations"
// (MF-L3S-Sargassum-AFAI-OLCI), Meteo-France/CNRM, distribuido por Ifremer/CERSAT via Odatis.
// DOI 10.12770/1eb82d09-77ed-4f63-9f03-2c3516a9713d. Acceso HTTPS abierto:
// https://data-cersat.ifremer.fr/data/sargassum/l3s/mf-l3s-sargassum-afai-olci/
//
// Metodo de extraccion (script offline scripts/extract_odatis.py, 2026-09-20): para la caja del Caribe
// mexicano (lat 17.8-21.6, lon -88.0--86.0) se contaron los pixeles con
// status_of_detections == 0 (= sargazo detectado) en la malla de 0.0032 grados, se
// convirtieron a km2 con el area real de cada pixel (corregida por cos(lat)), y se
// promediaron los dias [10, 20] de cada mes en los anios 2023, 2024, 2025 (hasta 6 muestras/mes).
//
// areaKm2 es MEDICION satelital real (superficie de sargazo detectada), limitada por
// nubosidad (los huecos sin observacion se excluyen, no se cuentan como cero). coveragePct
// es la fraccion de mar observado con sargazo (robusta a nubosidad). El pico observado real
// es julio-agosto (no junio-julio como asumia el diseno original).

/** Ya NO es placeholder: la serie proviene de la muestra real de Odatis. */
export const REFERENCE_IS_PLACEHOLDER = false;

export const REFERENCE_SOURCE_LABEL =
  "Odatis / Meteo-France - MF-L3S-Sargassum-AFAI-OLCI (DOI 10.12770/1eb82d09) - " +
  "area de sargazo detectada por satelite, Caribe mexicano, media de dias muestreados 2023-2025";

export interface MonthlyDetection {
  month: string; // clave de 3 letras en ingles, consistente con SEASONALITY_CONSTANTS
  areaKm2: number; // superficie de sargazo detectada (medicion satelital real)
  coveragePct: number; // % de mar observado con sargazo (robusto a nubosidad)
}

// Factor de conversion de AREA DETECTADA a biomasa humeda estimada. ESTIMACION PROPIA,
// NO una medicion: un pixel "detectado" no esta cubierto al 100% por sargazo (los mantos
// ocupan una fraccion sub-pixel). Cadena de supuestos: cobertura sub-pixel ~4% x densidad
// de manto humedo ~3.5 kg/m2 -> 0.04 x 3.5 kg/m2 x 1e6 m2/km2 / 1000 = 140 t/km2. Ajustable;
// la incertidumbre es de al menos un orden de magnitud. Densidad de manto: literatura de
// biomasa de sargazo (p. ej. Wang et al. 2019, Science, DOI 10.1126/science.aaw7912).
export const WET_TONNES_PER_KM2_DETECTED = 140;

export const MONTHLY_REFERENCE_DETECTION: MonthlyDetection[] = [
  { month: "Jan", areaKm2: 25.3, coveragePct: 0.056 },
  { month: "Feb", areaKm2: 164.6, coveragePct: 0.402 },
  { month: "Mar", areaKm2: 371.3, coveragePct: 0.789 },
  { month: "Apr", areaKm2: 501.6, coveragePct: 0.988 },
  { month: "May", areaKm2: 648.1, coveragePct: 1.284 },
  { month: "Jun", areaKm2: 493.3, coveragePct: 0.986 },
  { month: "Jul", areaKm2: 1448.7, coveragePct: 2.954 },
  { month: "Aug", areaKm2: 1744.4, coveragePct: 4.207 },
  { month: "Sep", areaKm2: 139.0, coveragePct: 1.166 },
  { month: "Oct", areaKm2: 19.6, coveragePct: 0.063 },
  { month: "Nov", areaKm2: 13.0, coveragePct: 0.039 },
  { month: "Dec", areaKm2: 13.8, coveragePct: 0.034 },
];
