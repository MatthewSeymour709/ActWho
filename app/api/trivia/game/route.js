import { getRandomCelebrities, getRandomCelebrity } from "@/utils/celebrities";
import { getCelebrityWithFacts } from "@/utils/wikipedia";

export async function GET(request) {
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
      targetData = await getCelebrityWithFacts(targetCelebrityName);
      if (!targetData || !targetData.facts || targetData.facts.length === 0) {
        console.warn(
          `Failed to get facts for ${targetCelebrityName}, retrying...`,
        );
        targetData = null;
      }
      retries++;
    }

    if (!targetData || targetData.facts.length === 0) {
      console.error("Failed to fetch celebrity data after max retries");
      return Response.json(
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

    return Response.json({
      gridCelebrities,
      target: targetData,
      factsRemaining: Math.max(0, targetData.facts.length - 1),
      currentFactIndex: 0,
    });
  } catch (error) {
    console.error("Game route error:", error);
    return Response.json(
      { error: "Failed to initialize game: " + error.message },
      { status: 500 },
    );
  }
}
