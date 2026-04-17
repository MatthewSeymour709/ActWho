import { getRandomCelebrities, getRandomCelebrity } from "@/utils/celebrities";
import { getCelebrityWithFacts } from "@/utils/wikipedia";
import clientPromise from "@/utils/mongoDB";
import { normalizeFactsEncoding, normalizeMojibake } from "@/utils/textEncoding";

function jsonUtf8(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBlankPlaceholder(text) {
  return text
    .replace(/this person/gi, "(Blank)")
    .replace(/^\(Blank\)\s+[\s\S]{1,260}?\bborn\b/i, "(Blank) (born")
    .replace(/^\(Blank\)\s+[\s\S]{1,220}?\(born\b/i, "(Blank) (born")
    .replace(/^\(Blank\)\s+[\s\S]{1,220}?,\s*known\b/i, "(Blank), known")
    .replace(/(\(Blank\)\s*){2,}/gi, "(Blank) ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanClueSentence(sentence) {
  let cleaned = normalizeBlankPlaceholder(sentence)
    .replace(/known professionally as/gi, "known as")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  // If a long bio preface exists before "known as", keep only the useful clue part.
  if (/^\(Blank\)/i.test(cleaned) && /\bknown as\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/^\(Blank\).*?\bknown as\b\s*/i, "(Blank) known as ");
  }

  // If the sentence starts with noisy prefixes, keep a concise actor/role sentence.
  if (/^\(Blank\)/i.test(cleaned) && !/^\(Blank\)\s+known as\b/i.test(cleaned)) {
    const isIndex = cleaned.search(/\bis\b/i);
    if (isIndex > 0 && isIndex < 260) {
      cleaned = `(Blank) ${cleaned.slice(isIndex).trim()}`;
    }
  }

  // Remove awkward pronoun duplication: "(Blank) he ..." -> "(Blank) ..."
  cleaned = cleaned
    .replace(/^\(Blank\)\s+(he|she|they)\s+/i, "(Blank) ")
    .replace(/^\(Blank\)\s+(his|her|their)\b/i, "(Blank)'s")
    .replace(/^\(Blank\)\s+prolific\b/i, "(Blank) is prolific")
    .replace(/^\(Blank\)\s+recipient\b/i, "(Blank) is a recipient")
    .replace(/^\(Blank\)\s+known\b/i, "(Blank) known");

  return cleaned
    .replace(/\(Blank\)\s+\(Blank\)/gi, "(Blank)")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureBlankPrefix(sentence) {
  const value = String(sentence || "").trim();
  if (!value) return "";

  if (/^\(Blank\)/i.test(value)) {
    return value;
  }

  const withoutPronoun = value
    .replace(/^(he|she|they)\s+/i, "")
    .replace(/^(his|her|their)\b\s*/i, "'s ")
    .trim();

  if (/^is\b/i.test(withoutPronoun)) {
    return `(Blank) ${withoutPronoun}`;
  }

  // Keep clue readable while ensuring every prompt is anonymized consistently.
  return `(Blank) ${withoutPronoun.charAt(0).toLowerCase()}${withoutPronoun.slice(1)}`;
}

function collapseLeadingNameClause(sentence) {
  return String(sentence || "")
    .replace(/^[^,.;:!?]{1,260}?\bborn\b/i, "(Blank) (born")
    .replace(/^[^,.;:!?]{1,140}\s*\(born\b/i, "(Blank) (born")
    .replace(/^[^,.;:!?]{1,160},\s*known\b/i, "(Blank), known")
    .trim();
}

function buildNameAliases(name) {
  const normalizedName = normalizeMojibake(name);
  const parts = String(normalizedName || "")
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}\p{N}'-]/gu, "").trim())
    .filter((part) => part.length > 2);

  return Array.from(new Set([normalizedName, ...parts].filter(Boolean)));
}

function sanitizeFactsForGuessing(name, facts, maxFacts = 5) {
  const aliases = buildNameAliases(name);

  const normalized = facts
    .map((fact) => {
      let sanitized = collapseLeadingNameClause(String(fact || ""));

      for (const alias of aliases) {
        const pattern = alias.includes(" ")
          ? new RegExp(escapeRegex(alias), "gi")
          : new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi");
        sanitized = sanitized.replace(
          pattern,
          "(Blank)",
        );
      }

      return cleanClueSentence(sanitized);
    })
    .filter((fact) => fact.length > 20)
    .map((fact) => ensureBlankPrefix(fact));

  const deduped = Array.from(new Set(normalized));
  return deduped.slice(0, maxFacts);
}

async function getCelebrityFromDatabase(name) {
  const client = await clientPromise;
  const db = client.db("trivia_game");
  const celebritiesCollection = db.collection("celebrities");

  const record = await celebritiesCollection.findOne({ name });
  if (!record || !Array.isArray(record.facts) || record.facts.length === 0) {
    return null;
  }

  return {
    name: normalizeMojibake(record.name),
    facts: normalizeFactsEncoding(record.facts),
  };
}

async function upsertCelebrityIntoDatabase(data) {
  const client = await clientPromise;
  const db = client.db("trivia_game");
  const celebritiesCollection = db.collection("celebrities");

  await celebritiesCollection.updateOne(
    { name: normalizeMojibake(data.name) },
    {
      $set: {
        name: normalizeMojibake(data.name),
        facts: normalizeFactsEncoding(data.facts),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function GET() {
  try {
    // Get 1 random celebrity that will be the target, with retries

    let targetData = null;
    let targetCelebrityName = null;
    let retries = 0;
    const maxRetries = 5;

    while (!targetData && retries < maxRetries) {
      targetCelebrityName = await getRandomCelebrity();
      console.log(
        `Fetching data for ${targetCelebrityName}... (attempt ${retries + 1})`,
      );

      targetData = await getCelebrityFromDatabase(targetCelebrityName);

      if (!targetData) {
        targetData = await getCelebrityWithFacts(targetCelebrityName);

        if (targetData) {
          targetData = {
            ...targetData,
            name: normalizeMojibake(targetData.name),
            facts: normalizeFactsEncoding(targetData.facts),
          };
          await upsertCelebrityIntoDatabase(targetData);
        }
      }

      if (!targetData || !targetData.facts || targetData.facts.length === 0) {
        console.warn(
          `Failed to get facts for ${targetCelebrityName}, retrying...`,
        );
        targetData = null;
      } else {
        const sanitizedFacts = sanitizeFactsForGuessing(
          targetCelebrityName,
          targetData.facts,
        );

        if (sanitizedFacts.length === 0) {
          targetData = null;
        } else {
          targetData = {
            ...targetData,
            facts: sanitizedFacts,
          };
        }
      }
      retries++;
    }

    if (!targetData || targetData.facts.length === 0) {
      console.error("Failed to fetch celebrity data after max retries");
      return jsonUtf8(
        {
          error:
            "Failed to fetch celebrity data. Wikipedia API may be unavailable.",
        },
        { status: 503 },
      );
    }

    // Create grid with 24 other random celebrities + the target
    let allCelebs = await getRandomCelebrities(25);
    // Ensure target is included
    if (!allCelebs.includes(targetCelebrityName)) {
      allCelebs[0] = targetCelebrityName;
    }
    // Remove target from others, then shuffle and add back
    const gridCelebrities = allCelebs.filter((c) => c !== targetCelebrityName);
    gridCelebrities.push(targetCelebrityName);
    gridCelebrities.sort(() => 0.5 - Math.random());

    console.log(
      `Successfully loaded: ${targetData.name} with ${targetData.facts.length} facts`,
    );

    return jsonUtf8({
      gridCelebrities,
      target: targetData,
      factsRemaining: Math.max(0, targetData.facts.length - 1),
      currentFactIndex: 0,
    });
  } catch (error) {
    console.error("Game route error:", error);
    return jsonUtf8(
      { error: "Failed to initialize game: " + error.message },
      { status: 500 },
    );
  }
}
