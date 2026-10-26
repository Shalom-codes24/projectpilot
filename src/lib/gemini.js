import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
export const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";

let currentKeyIndex = 0;

/**
 * Returns a list of all configured Gemini API keys from environment and optional client header.
 */
export function getGeminiKeysPool(headerKey = null) {
  // Collect from main env vars
  const rawList = [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY];

  // Also collect any numbered env vars GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  for (let i = 1; i <= 20; i++) {
    const numberedKey = process.env[`GEMINI_API_KEY_${i}`];
    if (numberedKey) rawList.push(numberedKey);
  }

  // Also read .env.local directly to pick up all keys reliably
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const fileContent = fs.readFileSync(envPath, "utf8");
      const lines = fileContent.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
        if (match && match[2]) {
          const val = match[2].trim();
          for (const piece of val.split(",")) {
            const cleanPiece = piece.trim();
            if (cleanPiece.length > 5) rawList.push(cleanPiece);
          }
        }
      }
    }
  } catch (err) {
    // ignore filesystem errors if any
  }

  const envRaw = rawList.filter(Boolean).join(",");

  const parsed = envRaw
    .split(/[,;\n\r]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 5);

  const keys = Array.from(new Set(parsed));

  if (headerKey && typeof headerKey === "string" && headerKey.trim().length > 5) {
    const cleanHeaderKey = headerKey.trim();
    return [cleanHeaderKey, ...keys.filter((k) => k !== cleanHeaderKey)];
  }

  return keys;
}

/**
 * Returns masked metadata about the configured API key pool for the UI.
 */
export function getKeysStatus(headerKey = null) {
  const keys = getGeminiKeysPool(headerKey);
  const activeIdx = keys.length > 0 ? currentKeyIndex % keys.length : 0;

  return {
    totalKeys: keys.length,
    activeKeyIndex: activeIdx,
    model: GEMINI_TEXT_MODEL,
    keys: keys.map((key, index) => ({
      index: index + 1,
      preview: key.length > 12 ? `${key.slice(0, 7)}...${key.slice(-5)}` : "Key configured",
      isActive: index === activeIdx,
      status: index === activeIdx ? "active" : "standby"
    }))
  };
}

/**
 * Legacy getter returning a client for the current active key.
 */
export function getGeminiClient(headerKey = null) {
  const keys = getGeminiKeysPool(headerKey);
  if (keys.length === 0) return null;
  const apiKey = keys[currentKeyIndex % keys.length];
  return new GoogleGenAI({ apiKey });
}

/**
 * Checks whether an error is rate-limit, quota, or writing capacity related.
 */
function isRateLimitError(error) {
  if (!error) return false;
  const status = error.status || error.statusCode || error.response?.status;
  if (status === 429) return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate-limit") ||
    msg.includes("too many requests") ||
    msg.includes("resource_exhausted") ||
    msg.includes("exceeded your current quota")
  );
}

/**
 * Executes an AI operation with automatic failover rotation through the pool of configured keys.
 * Tries every unique key in order starting from the active key, ensuring zero skipped keys.
 */
export async function executeWithKeyRotation(taskFn, headerKey = null) {
  const keys = getGeminiKeysPool(headerKey);
  if (keys.length === 0) {
    throw new Error("AI is not configured. Add GEMINI_API_KEY to .env.local and restart the app.");
  }

  const totalKeys = keys.length;
  const startIndex = currentKeyIndex % totalKeys;

  // Build a deterministic list of keys to try in order, exactly once each
  const orderedKeys = [];
  for (let i = 0; i < totalKeys; i++) {
    orderedKeys.push(keys[(startIndex + i) % totalKeys]);
  }

  let lastError = null;

  for (let i = 0; i < orderedKeys.length; i++) {
    const apiKey = orderedKeys[i];
    const keyIndex = keys.indexOf(apiKey);
    const client = new GoogleGenAI({ apiKey });

    try {
      const result = await taskFn(client, apiKey, keyIndex);
      // Key succeeded! Update current active key to this working key
      currentKeyIndex = keyIndex;
      return result;
    } catch (error) {
      lastError = error;
      const isFailoverCandidate = isRateLimitError(error) || error.status === 429 || error.status === 503;
      console.warn(
        `[Gemini Auto-Failover] Key #${keyIndex + 1} (${apiKey.slice(0, 8)}...) failed (status=${error.status || 'unknown'}, msg=${error.message}). Attempt ${i + 1} of ${orderedKeys.length}.`
      );

      if (isFailoverCandidate && i < orderedKeys.length - 1) {
        const nextKey = orderedKeys[i + 1];
        const nextIndex = keys.indexOf(nextKey);
        console.log(`[Gemini Auto-Failover] Switching immediately to Key #${nextIndex + 1}...`);
        continue;
      }

      // If not a failover candidate or it's the last key, rethrow with clear details
      if (!isFailoverCandidate) {
        throw error;
      }
    }
  }

  const detailedMessage = lastError?.message || "All configured keys reached capacity.";
  const err = new Error(`All ${keys.length} API keys failed. Latest issue: ${detailedMessage}`);
  err.status = 429;
  throw err;
}
