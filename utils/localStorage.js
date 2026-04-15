// Local storage utils for browser-based stat tracking

/**
 * Storing stats in localStorage
 * @type {string}
 */
const STATS_KEY = "trivia_stats";
/**
 * Storing user ID in localStorage
 * @type {string}
 */
const USER_ID_KEY = "trivia_user_id";
/**
 * Storing last played time in localStorage
 * @type {string}
 */
const LAST_PLAYED_KEY = "trivia_last_played";

/**
 * Get or create a unique userId in localStorage
 * @returns {string|null}
 */
export function getOrCreateUserId() {
  if (typeof window === "undefined") return null;

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Check if the user is still on 24-hour cooldown
 * @returns {boolean}
 */
export function canPlayToday() {
  if (typeof window === "undefined") return true;
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  if (!lastPlayed) return true;
  const lastPlayedDate = new Date(lastPlayed);
  const now = new Date();
  // 24hrs = 86400000 ms for reference
  return now - lastPlayedDate >= 86400000;
}

/**
 * Get lastPlayedTime from localStorage
 * @returns {Date|null}
 */
export function getLastPlayedTime() {
  if (typeof window === "undefined") return null;
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  return lastPlayed ? new Date(lastPlayed) : null;
}

/**
 * Save a game result to localStorage
 * @param {Object} result
 * @param {string} result.targetName
 * @param {number} result.roundsPlayed
 * @param {boolean} result.correct
 * @param {string} result.userId
 */
export function saveGameResult(result) {
  if (typeof window === "undefined") return;

  const stats = JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
  stats.push({
    ...result,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
}

/**
 * Get allStats from localStorage
 * @returns {Array}
 */
export function getAllStats() {
  if (typeof window === "undefined") return [];

  return JSON.parse(localStorage.getItem(STATS_KEY) || "[]");
}

/**
 * Get aggregateStats of totalGames, perfectScores, and averageScore
 * @returns {{totalGames: number, perfectScores: number, averageScore: number}}
 */
export function getAggregateStats() {
  if (typeof window === "undefined") return null;

  const stats = getAllStats();
  if (stats.length === 0) {
    return {
      totalGames: 0,
      perfectScores: 0,
      averageScore: 0,
    };
  }

  const totalGames = stats.length;
  const perfectScores = stats.filter((s) => s.roundsPlayed === 1).length;
  const averageScore = (
    stats.reduce((sum, s) => sum + s.roundsPlayed, 0) / totalGames
  ).toFixed(2);

  return {
    totalGames,
    perfectScores,
    averageScore,
  };
}
