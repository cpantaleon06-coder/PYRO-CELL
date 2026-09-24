// Función Edge de Vercel — Validación con IA de observaciones ciudadanas (Track 3).
//
// Proveedor de LLM: Groq (gratis, compatible con la API de OpenAI), modelo
// openai/gpt-oss-120b (ver nota en GROQ_MODEL), vía el Vercel AI SDK con el proveedor
// OpenAI-compatible apuntando a https://api.groq.com/openai/v1. Requiere la variable de entorno
// GROQ_API_KEY (configurar en el dashboard de Vercel; ver .env.example).
//
// Estrategia de salida estructurada: se intenta primero `generateObject` (JSON mode /
// structured outputs del SDK). Si Groq no lo soporta bien para este modelo y falla, se
// cae a `generateText` + parseo manual con validación. Si todo falla, se devuelve un
// resultado seguro con humanReviewRequired=true.

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText, jsonSchema } from "ai";
import {
  deterministicAnomalyFlags,
  isWithinSargassumZone,
  PLAUSIBLE_TONNAGE_RANGE,
  type AIValidationOutput,
  type CitizenObservationInput,
  type Morphotype,
} from "../src/lib/constants";
import { isLang, type Lang } from "../src/lib/lang";

export const config = { runtime: "edge" };

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
// Modelo de Groq disponible en la cuenta (llama-3.3-70b-versatile no está accesible
// para esta clave; gpt-oss-120b es el modelo de razonamiento más capaz disponible aquí).
const GROQ_MODEL = "openai/gpt-oss-120b";
const VALID_MORPHOTYPES: Morphotype[] = ["S_natans_I", "S_natans_VIII", "S_fluitans_III", "unknown"];

/** Idioma en que el modelo debe redactar su salida (el prompt sigue en español). */
const OUTPUT_LANGUAGE: Record<Lang, string> = {
  es: "español",
  en: "inglés (English)",
  fr: "francés (français)",
  pt: "portugués de Brasil (português do Brasil)",
};

/** Mensajes que el usuario sí puede llegar a ver desde el formulario. */
const MSG: Record<
  Lang,
  { invalid: string; unreachable: string; noExplanation: string; unparseableFlag: string; unparseable: string }
> = {
  es: {
    invalid: "Faltan campos requeridos o son inválidos (descripción, tonelaje, latitud/longitud).",
    unreachable: "No se pudo contactar al modelo de Groq.",
    noExplanation: "El modelo no entregó una explicación; se marca para revisión humana.",
    unparseableFlag: "El modelo devolvió una respuesta no interpretable como JSON.",
    unparseable: "No se pudo interpretar la respuesta del modelo; la observación queda para revisión humana.",
  },
  en: {
    invalid: "Required fields are missing or invalid (description, tonnage, latitude/longitude).",
    unreachable: "Could not reach the Groq model.",
    noExplanation: "The model returned no explanation; flagged for human review.",
    unparseableFlag: "The model returned a response that could not be read as JSON.",
    unparseable: "The model's response could not be interpreted; the observation is left for human review.",
  },
  fr: {
    invalid: "Des champs requis sont manquants ou invalides (description, tonnage, latitude/longitude).",
    unreachable: "Impossible de joindre le modèle Groq.",
    noExplanation: "Le modèle n'a fourni aucune explication ; signalé pour révision humaine.",
    unparseableFlag: "Le modèle a renvoyé une réponse illisible en JSON.",
    unparseable: "La réponse du modèle n'a pas pu être interprétée ; l'observation est laissée à une révision humaine.",
  },
  pt: {
    invalid: "Campos obrigatórios ausentes ou inválidos (descrição, tonelagem, latitude/longitude).",
    unreachable: "Não foi possível contatar o modelo do Groq.",
    noExplanation: "O modelo não forneceu explicação; marcado para revisão humana.",
    unparseableFlag: "O modelo devolveu uma resposta que não pôde ser lida como JSON.",
    unparseable: "Não foi possível interpretar a resposta do modelo; a observação fica para revisão humana.",
  },
};

function parseLang(raw: unknown): Lang {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>).lang : undefined;
  return isLang(v) ? v : "es";
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Valida y normaliza el cuerpo recibido a un CitizenObservationInput bien formado. */
function parseInput(raw: unknown): CitizenObservationInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const gps = r.gpsLocation as Record<string, unknown> | undefined;
  const lat = Number(gps?.lat);
  const lng = Number(gps?.lng);
  if (typeof r.photoDescription !== "string" || r.photoDescription.trim() === "") return null;
  if (!Number.isFinite(Number(r.estimatedTonnage))) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const morpho =
    typeof r.observedMorphotype === "string" && VALID_MORPHOTYPES.includes(r.observedMorphotype as Morphotype)
      ? (r.observedMorphotype as Morphotype)
      : "unknown";
  return {
    photoDescription: r.photoDescription.trim(),
    estimatedTonnage: Number(r.estimatedTonnage),
    gpsLocation: { lat, lng },
    observedMorphotype: morpho,
  };
}

function buildPrompt(input: CitizenObservationInput, deterministic: string[], lang: Lang): string {
  const inZone = isWithinSargassumZone(input.gpsLocation.lat, input.gpsLocation.lng);
  return [
    "Eres un validador experto de observaciones ciudadanas de arribazón de sargazo pelágico",
    "en el Caribe mexicano y el Golfo de México. Evalúa la CONSISTENCIA de los datos reportados.",
    "",
    "Razona PASO A PASO antes de concluir:",
    "1. ¿La descripción de la foto es coherente con sargazo (color pardo/dorado, olor, morfología)?",
    "2. ¿El tonelaje estimado es plausible para una observación puntual de playa?",
    `   Rango plausible de referencia: [${PLAUSIBLE_TONNAGE_RANGE.min}, ${PLAUSIBLE_TONNAGE_RANGE.max}] toneladas.`,
    "3. ¿La ubicación GPS cae en una zona de sargazo conocida (Caribe mexicano / Golfo de México)?",
    "4. Si se declara un morfotipo, ¿la descripción es consistente con él?",
    "   (S. natans: hojas largas y angostas, vesículas con espina; S. fluitans: hojas cortas y anchas, sin espina).",
    "",
    "Datos reportados:",
    `- Descripción de la foto: ${input.photoDescription}`,
    `- Tonelaje estimado: ${input.estimatedTonnage} t`,
    `- GPS: lat ${input.gpsLocation.lat}, lng ${input.gpsLocation.lng} (dentro de zona conocida: ${inZone ? "sí" : "no"})`,
    `- Morfotipo observado: ${input.observedMorphotype ?? "unknown"}`,
    "",
    deterministic.length > 0
      ? `Chequeos automáticos previos detectaron: ${deterministic.join(" ")}`
      : "Chequeos automáticos previos no detectaron anomalías obvias.",
    "",
    "Devuelve tu evaluación con: confidenceScore (0 a 1), anomalyFlags (lista de cadenas, vacía si no hay),",
    "explanation (2-3 frases en lenguaje llano, sin jerga), reasoning (tu razonamiento paso a paso),",
    "y humanReviewRequired (true si confidenceScore < 0.6 o hay anomalías).",
    "",
    `IDIOMA DE SALIDA: redacta explanation, reasoning y cada elemento de anomalyFlags en ${OUTPUT_LANGUAGE[lang]}.`,
  ].join("\n");
}

const outputSchema = jsonSchema<{
  confidenceScore: number;
  anomalyFlags: string[];
  explanation: string;
  reasoning: string;
  humanReviewRequired: boolean;
}>({
  type: "object",
  additionalProperties: false,
  required: ["confidenceScore", "anomalyFlags", "explanation", "reasoning", "humanReviewRequired"],
  properties: {
    confidenceScore: { type: "number", minimum: 0, maximum: 1, description: "Confianza de que la observación es consistente (0 a 1)." },
    anomalyFlags: { type: "array", items: { type: "string" }, description: "Anomalías detectadas; vacío si no hay." },
    explanation: { type: "string", description: "Explicación breve en lenguaje llano, en el idioma pedido." },
    reasoning: { type: "string", description: "Razonamiento paso a paso." },
    humanReviewRequired: { type: "boolean" },
  },
});

/** Fusiona la salida cruda del modelo con los chequeos deterministas y aplica la regla
 *  de negocio de humanReviewRequired (confianza < 0.6 O cualquier anomalía). */
function normalize(raw: Partial<AIValidationOutput>, deterministic: string[], lang: Lang): AIValidationOutput {
  const rawScore = Number(raw.confidenceScore);
  const confidenceScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(1, rawScore)) : 0;
  const modelFlags = Array.isArray(raw.anomalyFlags) ? raw.anomalyFlags.filter((f) => typeof f === "string") : [];
  // Unir sin duplicar los chequeos deterministas con los del modelo.
  const anomalyFlags = Array.from(new Set([...deterministic, ...modelFlags]));
  const explanation = typeof raw.explanation === "string" && raw.explanation.trim() !== ""
    ? raw.explanation.trim()
    : MSG[lang].noExplanation;
  return {
    confidenceScore,
    anomalyFlags,
    explanation,
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning.trim() : undefined,
    humanReviewRequired: confidenceScore < 0.6 || anomalyFlags.length > 0,
  };
}

/** Extrae el primer objeto JSON de un texto (por si el modelo lo envuelve en prosa o ```). */
function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: "GROQ_API_KEY no está configurada en el entorno del servidor." }, 500);
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido. Usa POST." }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Cuerpo JSON inválido." }, 400);
  }

  const lang = parseLang(body);
  const input = parseInput(body);
  if (!input) {
    return json({ error: MSG[lang].invalid }, 422);
  }

  const deterministic = deterministicAnomalyFlags(input, lang);
  const groq = createOpenAICompatible({ name: "groq", baseURL: GROQ_BASE_URL, apiKey });
  const model = groq.chatModel(GROQ_MODEL);
  const prompt = buildPrompt(input, deterministic, lang);

  // Intento 1: salida estructurada del SDK (JSON mode / structured outputs).
  try {
    const { object } = await generateObject({ model, schema: outputSchema, prompt, temperature: 0.2 });
    return json(normalize(object, deterministic, lang), 200);
  } catch {
    // Intento 2: texto libre + parseo manual con validación.
    try {
      const { text } = await generateText({
        model,
        prompt: `${prompt}\n\nResponde ÚNICAMENTE con el objeto JSON, sin texto adicional.`,
        temperature: 0.2,
      });
      const parsed = extractJson(text);
      if (parsed) {
        return json(normalize(parsed, deterministic, lang), 200);
      }
      // JSON mal formado: fallback seguro a revisión humana.
      return json(
        normalize(
          {
            confidenceScore: 0,
            anomalyFlags: [MSG[lang].unparseableFlag],
            explanation: MSG[lang].unparseable,
          },
          deterministic,
          lang
        ),
        200
      );
    } catch (err) {
      return json({ error: MSG[lang].unreachable, detail: String(err) }, 502);
    }
  }
}
