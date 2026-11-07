import {
  buildCategoryTryOnPrompt,
  DEFAULT_TRY_ON_NEGATIVE_PROMPT,
  DEFAULT_TRY_ON_PROMPT,
  tryOnPieceLabel,
} from "@/lib/try-on-prompts";
import type { ResolvedTryOnSettings } from "@/lib/try-on-settings";
import { getResolvedTryOnSettings, resolveRunpodEndpointMode } from "@/lib/try-on-settings";
import { getRunpodConfig } from "@/lib/env";

export type RunpodJob = {
  id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "stub";
  output?: Record<string, unknown> | string | unknown[];
  result_url?: string;
  error?: string;
};

export function isRunpodConfigured() {
  return Boolean(getRunpodConfig().apiKey && getRunpodConfig().endpointId);
}

function cleanStatusTemplate(template: string) {
  return template.replace(/\{jobId\}\)/g, "{jobId}").replace(/\{jobId\}\s*\)/g, "{jobId}");
}

function buildPrompts(input: {
  settings: ResolvedTryOnSettings;
  productDetails: string;
  category: string;
}) {
  const piece = tryOnPieceLabel(input.category);
  const categoryPrompt = input.category.trim() ? buildCategoryTryOnPrompt(input.category) : DEFAULT_TRY_ON_PROMPT;
  const override = input.settings.promptOverride?.trim();
  const base = override
    ? override.includes("{piece}")
      ? override.replaceAll("{piece}", piece)
      : `${categoryPrompt} ${override}`
    : categoryPrompt;
  const negative = input.settings.negativePromptOverride || DEFAULT_TRY_ON_NEGATIVE_PROMPT;
  const prompt = input.productDetails ? `${base} Product Information: ${input.productDetails}` : base;
  return { prompt, negativePrompt: negative };
}

function buildRequestBody(input: {
  settings: ResolvedTryOnSettings;
  personImageUrl: string;
  garmentImageUrl: string;
  productDetails: string;
  productMetadata: Record<string, string>;
}) {
  const mode = resolveRunpodEndpointMode(input.settings.endpointMode, input.settings.submitJobUrl);
  const { prompt, negativePrompt } = buildPrompts({
    settings: input.settings,
    productDetails: input.productDetails,
    category: input.productMetadata.category ?? "",
  });

  if (mode === "qwen_image_edit") {
    return {
      input: {
        image: input.personImageUrl,
        prompt,
        negative_prompt: negativePrompt,
        garment_image: input.garmentImageUrl,
        output_format: "jpeg",
        seed: -1,
        enable_safety_checker: true,
      },
    };
  }

  const body: {
    input: Record<string, unknown>;
  } = {
    input: {
      images: [input.personImageUrl, input.garmentImageUrl],
      prompt,
      negative_prompt: negativePrompt,
    },
  };

  if (input.productDetails) {
    body.input.product_details = input.productDetails;
  }
  if (Object.keys(input.productMetadata).length > 0) {
    body.input.product_metadata = input.productMetadata;
  }

  return body;
}

export async function startTryOnJob(input: {
  personImageUrl: string;
  garmentImageUrl: string;
  productDetails: string;
  productMetadata: Record<string, string>;
  settings?: ResolvedTryOnSettings;
}) {
  const settings = input.settings ?? (await getResolvedTryOnSettings());
  if (!settings.apiKey) {
    throw new Error("RunPod API is not configured.");
  }

  const requestBody = buildRequestBody({
    settings,
    personImageUrl: input.personImageUrl,
    garmentImageUrl: input.garmentImageUrl,
    productDetails: input.productDetails,
    productMetadata: input.productMetadata,
  });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < settings.maxRetries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);
      const response = await fetch(settings.submitJobUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? `RunPod API error: ${response.status}`);
      }
      if (!json.id) {
        throw new Error("RunPod did not return a job id");
      }
      return { id: json.id, status: "IN_QUEUE" as const };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("RunPod job failed to start");
      if (lastError.name === "AbortError") {
        lastError = new Error(`Request timeout after ${settings.timeoutMs}ms`);
      }
      if (attempt < settings.maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("Failed to submit try-on request");
}

export async function getTryOnJob(jobId: string, settings?: ResolvedTryOnSettings) {
  const resolved = settings ?? (await getResolvedTryOnSettings());
  if (!resolved.apiKey) {
    throw new Error("RunPod API is not configured.");
  }

  const cleanJobId = String(jobId).trim().replace(/[)\s]+$/, "");
  const template = cleanStatusTemplate(resolved.checkStatusUrlTemplate);
  const statusUrl = template.replace("{jobId}", cleanJobId);

  const response = await fetch(statusUrl, {
    headers: { Authorization: `Bearer ${resolved.apiKey}` },
  });
  const json = (await response.json()) as RunpodJob;
  if (!response.ok) {
    throw new Error("RunPod status failed");
  }
  return json;
}

export function extractRunpodCostUsd(job: RunpodJob): number | null {
  const output = job.output;
  if (!output || typeof output !== "object" || Array.isArray(output)) return null;
  const cost = (output as Record<string, unknown>).cost;
  const amount = typeof cost === "number" ? cost : typeof cost === "string" ? Number(cost) : NaN;
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export function extractResultUrl(job: RunpodJob, fallback: string) {
  const output = job.output;
  if (typeof output === "string" && output.startsWith("http")) return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];

  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    for (const key of ["result_image", "output_image", "image_url", "result_url", "image", "result"]) {
      const value = record[key];
      if (typeof value === "string" && value.startsWith("http")) return value;
    }
  }

  if (typeof job.result_url === "string" && job.result_url.startsWith("http")) {
    return job.result_url;
  }

  return fallback;
}

export function formatTryOnJobError(message: string | undefined) {
  if (!message?.trim()) return "The model could not finish this look.";
  if (message.includes("output_format") && message.includes("Field required")) {
    return "Try-on setup was incomplete. Ask an admin to update the app, then try again.";
  }
  const firstLine = message.split("\n")[0]?.trim();
  if (firstLine && firstLine.length <= 160) return firstLine;
  return "The model could not finish this look.";
}

export async function testRunPodConnection(input: {
  apiKey: string;
  submitJobUrl: string;
  endpointMode: ResolvedTryOnSettings["endpointMode"];
}) {
  if (!input.apiKey.trim()) {
    throw new Error("API key is required");
  }
  if (!input.submitJobUrl.trim()) {
    throw new Error("Submit job URL is required");
  }

  const mode = resolveRunpodEndpointMode(input.endpointMode, input.submitJobUrl);
  const placeholder = "https://example.com/photo.jpg";
  const body =
    mode === "qwen_image_edit"
      ? { input: { image: placeholder, prompt: "connection test", garment_image: placeholder } }
      : { input: { images: [placeholder, placeholder], prompt: "connection test" } };

  const response = await fetch(input.submitJobUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Invalid API key or insufficient permissions");
  }
  if (response.status === 404) {
    throw new Error("Endpoint not found. Check your submit job URL.");
  }
  if (response.status === 405) {
    return { success: true, message: "Connection successful. Endpoint is reachable." };
  }
  if (response.ok || (response.status >= 200 && response.status < 500)) {
    return { success: true, message: "Connection successful. API credentials are valid." };
  }

  const errorText = await response.text().catch(() => "");
  throw new Error(`API connection failed: ${response.status} ${response.statusText}. ${errorText}`.trim());
}
