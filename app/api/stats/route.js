import clientPromise from "@/utils/mongodb";
import { ObjectId } from "mongodb";

/**
 * Save user stats to the database
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function POST(request) {
  try {
    const { userId, correctAnswers, roundsPlayed, targetName } =
      await request.json();

    const client = await clientPromise;
    const db = client.db("trivia_game");
    const statsCollection = db.collection("stats");

    const result = await statsCollection.insertOne({
      userId,
      correctAnswers,
      roundsPlayed,
      targetName,
      timestamp: new Date(),
    });

    return Response.json({
      success: true,
      id: result.insertedId,
      message: "Stats saved successfully",
    });
  } catch (error) {
    console.error("Stats route error:", error);
    return Response.json({ error: "Failed to save stats" }, { status: 500 });
  }
}

/**
 * Retrieve user stats and aggregate stats from the database
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "Missing userId parameter" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("trivia_game");
    const statsCollection = db.collection("stats");

    const stats = await statsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate aggregate stats
    const totalGames = stats.length;
    const perfectScores = stats.filter((s) => s.roundsPlayed === 1).length;
    const averageScore =
      totalGames > 0
        ? (
            stats.reduce((sum, s) => sum + s.roundsPlayed, 0) / totalGames
          ).toFixed(2)
        : 0;

    return Response.json({
      stats,
      aggregateStats: {
        totalGames,
        perfectScores,
        averageScore,
      },
    });
  } catch (error) {
    console.error("Stats retrieval error:", error);
    return Response.json(
      { error: "Failed to retrieve stats" },
      { status: 500 },
    );
  }
}
