function looksLikeMojibake(value) {
  return /(Ã.|Â.|â.|ð.|™|œ|ž)/.test(value);
}

/**
 * Fix common UTF-8/Latin-1 mojibake sequences (e.g. TimothÃ©e -> Timothée).
 * Leaves normal strings unchanged.
 * @param {string} value
 * @returns {string}
 */
export function normalizeMojibake(value) {
  const input = String(value || "");
  if (!input || !looksLikeMojibake(input)) {
    return input;
  }

  try {
    const decoded = Buffer.from(input, "latin1").toString("utf8");
    return decoded || input;
  } catch {
    return input;
  }
}

/**
 * Normalize every string in a fact array.
 * @param {string[]} facts
 * @returns {string[]}
 */
export function normalizeFactsEncoding(facts) {
  if (!Array.isArray(facts)) return [];
  return facts.map((fact) => normalizeMojibake(fact));
}
