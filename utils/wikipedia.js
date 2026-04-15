// utils/wikipedia.js

/**
 * Fetching celebrity facts from Wikipedia.
 * @param {string} name
 * @returns {Promise<{name: string, facts: string[]}>}
 */
export async function getCelebrityWithFacts(name) {
  // Returns data for development/build
  return {
    name,
    facts: [
      `Fact 1 about ${name}`,
      `Fact 2 about ${name}`,
      `Fact 3 about ${name}`,
      `Fact 4 about ${name}`,
      `Fact 5 about ${name}`,
    ],
  };
}

/**
 * Fetching a celebrity image url from Wikipedia.
 * @param {string} name
 * @returns {Promise<string|null>}
 */
export async function getCelebrityImage(name) {
  // Return null or image URL
  return null;
}
