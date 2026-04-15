export async function POST(request) {
  try {
    const { facts, currentFactIndex } = await request.json();

    if (!facts || currentFactIndex === undefined) {
      return Response.json(
        { error: "Missing facts or currentFactIndex" },
        { status: 400 },
      );
    }

    // Get next fact
    const nextIndex = currentFactIndex + 1;

    if (nextIndex >= facts.length) {
      return Response.json(
        { error: "No more facts available" },
        { status: 400 },
      );
    }

    return Response.json({
      fact: facts[nextIndex],
      currentFactIndex: nextIndex,
      factsRemaining: Math.max(0, facts.length - nextIndex - 1),
    });
  } catch (error) {
    console.error("Facts route error:", error);
    return Response.json(
      { error: "Failed to fetch next fact" },
      { status: 500 },
    );
  }
}
