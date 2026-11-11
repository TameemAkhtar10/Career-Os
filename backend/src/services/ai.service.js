import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";

const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_429_DELAY_MS = 2000;
const MAX_429_DELAY_MS = 5000;
const DEFAULT_RETRY_DELAY_MS = 1500;

const OPENAI_COMPATIBLE_URLS = {
  mistral: "https://api.mistral.ai/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEnvValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();

const resolveEnv = (key, fallback = "") => {
  const raw = process.env[key] !== undefined ? process.env[key] : env[key];
  const cleaned = normalizeEnvValue(raw);
  return cleaned || normalizeEnvValue(fallback);
};

function getUrlHostAndPath(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "";
  }
}

async function extractGroqErrorMessage(response) {
  if (!response || typeof response.json !== "function") {
    return "";
  }
  try {
    const data = await response.json();
    const msg = data?.error?.message;
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim().slice(0, 120);
    }
  } catch {
    // Ignore non-JSON error responses
  }
  return "";
}

/**
 * Parses Retry-After header (seconds or HTTP-date) with 2s fallback and 5s cap.
 */
function getRetryAfterDelayMs(response) {
  const raw =
    typeof response?.headers?.get === "function"
      ? response.headers.get("retry-after")
      : response?.headers?.["retry-after"] ?? response?.headers?.["Retry-After"];

  if (raw === null || raw === undefined) {
    return DEFAULT_429_DELAY_MS;
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return DEFAULT_429_DELAY_MS;
  }

  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) {
    if (seconds < 0) return DEFAULT_429_DELAY_MS;
    return Math.min(MAX_429_DELAY_MS, Math.round(seconds * 1000));
  }

  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    const deltaMs = dateMs - Date.now();
    return Math.min(MAX_429_DELAY_MS, Math.max(0, deltaMs));
  }

  return DEFAULT_429_DELAY_MS;
}

/**
 * Renders a concise, human-readable JSON shape description from a Zod schema
 * without requiring an external zod-to-json-schema dependency.
 */
function describeZodSchema(schema, indent = 0, seen = new Set()) {
  if (!schema || typeof schema !== "object") return "";
  if (seen.has(schema)) return "any";

  const def = schema._zod?.def || schema._def;
  if (!def) return "";

  const pad = "  ".repeat(indent);
  const childPad = "  ".repeat(indent + 1);
  const kind = def.type || def.typeName;

  if (
    kind === "default" ||
    kind === "optional" ||
    kind === "prefault" ||
    kind === "readonly" ||
    kind === "nonoptional" ||
    kind === "catch" ||
    kind === "ZodDefault" ||
    kind === "ZodOptional" ||
    kind === "ZodReadonly" ||
    kind === "ZodCatch"
  ) {
    return describeZodSchema(def.innerType, indent, seen);
  }

  if (kind === "nullable" || kind === "ZodNullable") {
    const inner = describeZodSchema(def.innerType, indent, seen);
    return inner ? `${inner} | null` : "null";
  }

  if (kind === "string" || kind === "ZodString") return "string";
  if (kind === "number" || kind === "ZodNumber") return "number";
  if (kind === "boolean" || kind === "ZodBoolean") return "boolean";
  if (kind === "null" || kind === "ZodNull") return "null";

  if (kind === "enum" || kind === "ZodEnum") {
    const values = def.entries ? Object.values(def.entries) : def.values || [];
    return values.map((v) => JSON.stringify(v)).join(" | ") || "string";
  }

  if (kind === "literal" || kind === "ZodLiteral") {
    const values = def.values ?? (def.value !== undefined ? [def.value] : []);
    return values.map((v) => JSON.stringify(v)).join(" | ") || "any";
  }

  if (kind === "union" || kind === "ZodUnion") {
    const options = def.options || [];
    return options.map((opt) => describeZodSchema(opt, indent, seen) || "any").join(" | ");
  }

  if (kind === "array" || kind === "ZodArray") {
    seen.add(schema);
    const element = def.element || def.type;
    const itemDesc = describeZodSchema(element, indent + 1, seen) || "any";
    seen.delete(schema);
    if (itemDesc.includes("\n")) {
      return `[\n${childPad}${itemDesc}\n${pad}]`;
    }
    return `[${itemDesc}]`;
  }

  if (kind === "object" || kind === "ZodObject") {
    seen.add(schema);
    const shape = typeof def.shape === "function" ? def.shape() : def.shape || {};
    const entries = Object.entries(shape);
    if (entries.length === 0) {
      seen.delete(schema);
      return "{}";
    }
    const lines = entries.map(([key, val]) => {
      const valDesc = describeZodSchema(val, indent + 1, seen) || "any";
      return `${childPad}${JSON.stringify(key)}: ${valDesc}`;
    });
    seen.delete(schema);
    return `{\n${lines.join(",\n")}\n${pad}}`;
  }

  return "any";
}

/**
 * Execute a single HTTP request with 30s timeout
 */
async function callProviderApi({ provider, apiKey, model, systemPrompt, userPrompt }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let url = "";
    const headers = { "Content-Type": "application/json" };
    let body = {};

    if (OPENAI_COMPATIBLE_URLS[provider]) {
      url = OPENAI_COMPATIBLE_URLS[provider];
      headers.Authorization = `Bearer ${apiKey}`;
      body = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      };
    } else if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      body = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      };
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses JSON response according to provider format
 */
async function extractRawJsonString(res, provider) {
  const data = await res.json();
  if (provider === "mistral" || provider === "groq") {
    return data.choices?.[0]?.message?.content || "";
  }
  if (provider === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  return "";
}

/**
 * Helper to log sanitized failure message:
 * ONLY provider name, HTTP status, and an error category
 * (plus URL host+path, model, and truncated error.message for groq only).
 * Never logs keys, headers, request body, resume text, or model output.
 */
function logAiFailure(provider, status, category, groqDetails = null) {
  if (provider === "groq" && groqDetails) {
    const parts = [
      `provider=${provider}`,
      `status=${status ?? null}`,
      `category=${category}`,
      `url=${groqDetails.hostPath || null}`,
      `model=${groqDetails.model || null}`,
    ];
    if (groqDetails.errorMessage) {
      parts.push(`error=${groqDetails.errorMessage}`);
    }
    console.error(`[ai.service] failure: ${parts.join(", ")}`);
    return;
  }

  console.error(
    `[ai.service] failure: provider=${provider}, status=${status ?? null}, category=${category}`
  );
}

/**
 * Generates structured JSON from the selected AI provider (Mistral, Gemini, or Groq).
 * REST API over fetch, 30s timeout, one retry on 429/5xx, Zod validation.
 *
 * @param {Object} params
 * @param {string} params.system
 * @param {string} params.user
 * @param {import("zod").ZodTypeAny} params.schema
 * @returns {Promise<any>}
 */
export async function generateJson({ system, user, schema }) {
  const provider = resolveEnv("AI_PROVIDER", "mistral").toLowerCase();

  let apiKey = "";
  let model = "";

  if (provider === "mistral") {
    apiKey = resolveEnv("MISTRAL_API_KEY");
    model = resolveEnv("MISTRAL_MODEL", "mistral-small-latest");
  } else if (provider === "gemini") {
    apiKey = resolveEnv("GEMINI_API_KEY");
    model = resolveEnv("GEMINI_MODEL", "gemini-1.5-flash");
  } else if (provider === "groq") {
    apiKey = resolveEnv("GROQ_API_KEY");
    model = resolveEnv("GROQ_MODEL");
  } else {
    logAiFailure(provider, null, "missing key");
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  const groqHostPath =
    provider === "groq" ? getUrlHostAndPath(OPENAI_COMPATIBLE_URLS.groq) : "";
  const buildGroqDetails = (errorMessage = "") =>
    provider === "groq"
      ? { hostPath: groqHostPath, model, errorMessage }
      : null;

  if (!apiKey || !model) {
    logAiFailure(provider, null, "missing key", buildGroqDetails());
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  // Ensure the system prompt explicitly mandates JSON-only output and describes the schema
  let schemaDescription = "";
  try {
    schemaDescription = describeZodSchema(schema);
  } catch {
    schemaDescription = "";
  }

  const schemaPromptSuffix = schemaDescription
    ? `\n\nIMPORTANT: Return JSON only. Reply with a single strictly valid JSON object matching this exact schema (do not enclose in markdown code fences or backticks):\n${schemaDescription}`
    : `\n\nIMPORTANT: Return JSON only. Reply with a single strictly valid JSON object matching the requested schema (do not enclose in markdown code fences or backticks).`;

  const systemPromptWithSchema = `${system}${schemaPromptSuffix}`;

  let response = null;
  let attempt = 0;
  const maxAttempts = 2; // initial + 1 retry

  while (attempt < maxAttempts) {
    attempt++;
    try {
      response = await callProviderApi({
        provider,
        apiKey,
        model,
        systemPrompt: systemPromptWithSchema,
        userPrompt: user,
      });

      if (response.status === 429 && attempt < maxAttempts) {
        await sleep(getRetryAfterDelayMs(response));
        continue;
      }

      if (response.status >= 500 && attempt < maxAttempts) {
        await sleep(DEFAULT_RETRY_DELAY_MS);
        continue;
      }

      break;
    } catch {
      if (attempt < maxAttempts) {
        await sleep(DEFAULT_RETRY_DELAY_MS);
        continue;
      }
      logAiFailure(provider, null, "timeout", buildGroqDetails());
      throw new ApiError(503, "AI service is temporarily unavailable");
    }
  }

  if (!response || !response.ok) {
    const status = response ? response.status : null;
    let category = "unknown";
    if (status === 401) category = "401";
    else if (status === 403) category = "403";
    else if (status === 404) category = "404";
    else if (status === 429) category = "429";
    else if (status && status >= 500) category = "5xx";
    else if (status) category = `${status}`;

    const groqErrorMessage =
      provider === "groq" ? await extractGroqErrorMessage(response) : "";
    logAiFailure(provider, status, category, buildGroqDetails(groqErrorMessage));
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  let rawText = "";
  try {
    rawText = await extractRawJsonString(response, provider);
  } catch {
    logAiFailure(provider, response.status, "JSON parse", buildGroqDetails());
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  if (!rawText) {
    logAiFailure(provider, response.status, "JSON parse", buildGroqDetails());
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  // Clean any accidental markdown code fences
  const cleanedText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    logAiFailure(provider, response.status, "JSON parse", buildGroqDetails());
    throw new ApiError(503, "AI service is temporarily unavailable");
  }

  if (schema) {
    try {
      return schema.parse(parsed);
    } catch (validationErr) {
      if (validationErr instanceof ZodError) {
        logAiFailure(provider, response.status, "zod validation", buildGroqDetails());
      } else {
        logAiFailure(provider, response.status, "zod validation", buildGroqDetails());
      }
      throw new ApiError(503, "AI service is temporarily unavailable");
    }
  }

  return parsed;
}
