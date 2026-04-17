const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
const wikipediaCache = new Map();
import { normalizeFactsEncoding, normalizeMojibake } from "./textEncoding";

function normalizeName(name) {
  return normalizeMojibake(String(name || "").trim());
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactAliases(sentence, aliases) {
  let redacted = sentence;

  for (const alias of aliases) {
    if (!alias) continue;

    const aliasRegex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi");
    redacted = redacted.replace(aliasRegex, "this person");
  }

  return redacted.replace(/\s+/g, " ").trim();
}

function toFacts(extract, aliases, maxFacts = 5) {
  if (!extract) return [];

  const normalizedAliases = Array.from(
    new Set(
      aliases
        .map((alias) => normalizeName(alias))
        .filter(Boolean),
    ),
  );

  return extract
    .replace(/\[[^\]]+\]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 35)
    .map((sentence) => redactAliases(sentence, normalizedAliases))
    .filter((sentence) => sentence.length > 35)
    .slice(0, maxFacts)
    .map((sentence) => sentence.replace(/^this person\s+this person\b/i, "This person"));
}

async function fetchWikipediaData(name) {
  const cleanName = normalizeName(name);

  if (!cleanName) {
    return null;
  }

  if (wikipediaCache.has(cleanName)) {
    return wikipediaCache.get(cleanName);
  }

  const url = `${WIKIPEDIA_API_BASE}?action=query&titles=${encodeURIComponent(
    cleanName,
  )}&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=500&redirects=1&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "cp3010-term-project/1.0",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      wikipediaCache.set(cleanName, null);
      return null;
    }

    const data = await response.json();
    const pages = data?.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;

    if (!page || page.missing !== undefined) {
      wikipediaCache.set(cleanName, null);
      return null;
    }

    const wikipediaTitle = normalizeMojibake(page.title || cleanName);
    const extract = page.extract || "";
    const facts = normalizeFactsEncoding(
      toFacts(extract, [cleanName, wikipediaTitle], 5),
    );
    const imageUrl = page?.thumbnail?.source || null;

    const result = {
      name: cleanName,
      wikipediaTitle,
      facts,
      imageUrl,
    };

    wikipediaCache.set(cleanName, result);
    return result;
  } catch (error) {
    console.error(`Wikipedia fetch failed for ${cleanName}:`, error);
    wikipediaCache.set(cleanName, null);
    return null;
  }
}

/**
 * Fetching celebrity facts from Wikipedia.
 * @param {string} name
 * @returns {Promise<{name: string, facts: string[]}|null>}
 */
export async function getCelebrityWithFacts(name) {
  const data = await fetchWikipediaData(name);

  if (!data || !data.facts || data.facts.length === 0) {
    return null;
  }

  return {
    name: data.name,
    facts: data.facts,
  };
}

/**
 * Fetching a celebrity image url from Wikipedia.
 * @param {string} name
 * @returns {Promise<string|null>}
 */
export async function getCelebrityImage(name) {
  const data = await fetchWikipediaData(name);
  return data?.imageUrl || null;
}
