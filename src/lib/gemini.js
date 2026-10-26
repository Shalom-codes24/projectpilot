import { GoogleGenAI } from "@google/genai";

export const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
export const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";

let currentKeyIndex = 0;
// Map of apiKey -> timestamp until when it is considered exhausted
const exhaustedKeyCooldowns = new Map();
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

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

  // Also read .env.local if running in Node environment to pick up any raw multi-line entries
  try {
    if (typeof process !== "undefined" && process.cwd) {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const fileContent = fs.readFileSync(envPath, "utf8");
        const lines = fileContent.split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(/^GEMINI_API_KEY(_\d+)?\s*=\s*(.+)$/);
          if (match && match[2]) {
            rawList.push(match[2].trim());
          }
        }
      }
    }
  } catch (err) {
    // ignore filesystem errors if client/edge
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
  const now = Date.now();
  const activeIdx = keys.length > 0 ? currentKeyIndex % keys.length : 0;

  return {
    totalKeys: keys.length,
    activeKeyIndex: activeIdx,
    model: GEMINI_TEXT_MODEL,
    keys: keys.map((key, index) => {
      const cooldownUntil = exhaustedKeyCooldowns.get(key) || 0;
      const isExhausted = cooldownUntil > now;
      return {
        index: index + 1,
        preview: key.length > 12 ? `${key.slice(0, 7)}...${key.slice(-5)}` : "Key configured",
        isActive: index === activeIdx && !isExhausted,
        status: isExhausted ? "quota_paused" : (index === activeIdx ? "active" : "standby")
      };
    })
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
    msg.includes("too many requests") ||
    msg.includes("resource_exhausted") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("limit")
  );
}

/**
 * Executes an AI operation with automatic failover rotation through the pool of configured keys.
 * Fast-skips known exhausted keys to eliminate the 35-second Google client retry hang.
 */
export async function executeWithKeyRotation(taskFn, headerKey = null) {
  const keys = getGeminiKeysPool(headerKey);
  if (keys.length === 0) {
    throw new Error("AI is not configured. Add GEMINI_API_KEY to .env.local and restart the app.");
  }

  const now = Date.now();
  // Filter available healthy keys first (not currently in quota cooldown)
  const healthyKeys = keys.filter((k) => (exhaustedKeyCooldowns.get(k) || 0) <= now);
  const candidateKeys = healthyKeys.length > 0 ? healthyKeys : keys; // fallback to all if all on cooldown

  let lastError = null;

  for (let attempt = 0; attempt < candidateKeys.length; attempt++) {
    const apiKey = candidateKeys[(currentKeyIndex + attempt) % candidateKeys.length];
    const keyGlobalIndex = keys.indexOf(apiKey);
    const client = new GoogleGenAI({ apiKey });

    try {
      const result = await taskFn(client, apiKey, keyGlobalIndex);
      // Success! Remember this key as active and clear any cooldown
      exhaustedKeyCooldowns.delete(apiKey);
      currentKeyIndex = keyGlobalIndex >= 0 ? keyGlobalIndex : 0;
      return result;
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        // Mark this key in cooldown so subsequent requests don't waste 35s on it
        exhaustedKeyCooldowns.set(apiKey, Date.now() + COOLDOWN_MS);
        const nextIdx = (keyGlobalIndex + 1) % keys.length;
        console.warn(
          `[Gemini Auto-Failover] Key #${keyGlobalIndex + 1} reached quota/rate-limit. Marking in 10m cooldown. Switching to backup key #${nextIdx + 1}...`
        );
        currentKeyIndex = nextIdx;
        continue;
      }
      throw error;
    }
  }

  const err = new Error(
    `All ${keys.length} configured Gemini API keys exceeded writing/quota limits. Please wait a moment or add another backup key.`
  );
  err.status = 429;
  throw err;
}
