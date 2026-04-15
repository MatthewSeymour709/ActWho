"use client";

import { useEffect, useState } from "react";
import {
  getAggregateStats,
  getAllStats,
  getOrCreateUserId,
} from "@/utils/localStorage";
import Link from "next/link";

export default function StatsPage() {
  const [aggregateStats, setAggregateStats] = useState(null);
  const [stats, setStats] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Avoid synchronous setState calls during render by using Promise.resolve
    Promise.resolve().then(() => {
      const statsData = getAggregateStats();
      const allStats = getAllStats();
      const id = getOrCreateUserId();
      setAggregateStats(statsData);
      setStats(allStats);
      setUserId(id);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl font-bold text-indigo-600">
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            Your Stats
          </h1>
          <p className="text-gray-600">Track your trivia performance</p>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {aggregateStats.totalGames}
            </div>
            <p className="text-gray-600">Total Games Played</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {aggregateStats.perfectScores}
            </div>
            <p className="text-gray-600">Perfect Scores (1/5)</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {aggregateStats.averageScore}
            </div>
            <p className="text-gray-600">Average Score</p>
          </div>
        </div>

        {/* Game History */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Game History
          </h2>

          {stats.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No games played yet. Start playing to see your history!</p>
              <Link
                href="/"
                className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
              >
                Play Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" aria-label="Game history">
                <thead className="border-b-2 border-indigo-300">
                  <tr>
                    <th scope="col" className="pb-3 font-semibold text-gray-700">Date</th>
                    <th scope="col" className="pb-3 font-semibold text-gray-700">Celebrity</th>
                    <th scope="col" className="pb-3 font-semibold text-gray-700">Score</th>
                    <th scope="col" className="pb-3 font-semibold text-gray-700">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="py-3 text-gray-700">
                        {new Date(stat.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-gray-700">{stat.targetName}</td>
                      <td className="py-3 text-gray-700">
                        {stat.roundsPlayed}/5
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            stat.correct
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                          aria-label={stat.correct ? "Correct" : "Incorrect"}
                        >
                          {stat.correct ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User ID Info */}
        <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-4 text-sm text-gray-600">
          <p>
            <strong>User ID:</strong> {userId}
          </p>
          <p className="mt-2 text-xs">
            Your stats are stored in your browser&apos;s local storage and
            synced to our database.
          </p>
        </div>
      </div>
    </div>
  );
}
