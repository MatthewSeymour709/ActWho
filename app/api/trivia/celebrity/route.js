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

async function getCelebritiesCollection() {
  const client = await clientPromise;
  const db = client.db("trivia_game");
  return db.collection("celebrities");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  const nameParam = searchParams.get("name");

  if (!idParam && !nameParam) {
    return jsonUtf8(
      { error: "Provide either ?id=<number> or ?name=<celebrity name>" },
      { status: 400 },
    );
  }

  const celebritiesCollection = await getCelebritiesCollection();

  let query;
  if (idParam) {
    const parsedId = Number.parseInt(idParam, 10);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return jsonUtf8(
        { error: "id must be a positive integer" },
        { status: 400 },
      );
    }
    query = { celebId: parsedId };
  } else {
    query = { name: normalizeMojibake(nameParam.trim()) };
  }

  const celebrity = await celebritiesCollection.findOne(query, {
    projection: {
      _id: 0,
      celebId: 1,
      name: 1,
      facts: 1,
      imageUrl: 1,
      source: 1,
      updatedAt: 1,
      createdAt: 1,
    },
  });

  if (!celebrity) {
    return jsonUtf8({ error: "Celebrity not found" }, { status: 404 });
  }

  const normalizedCelebrity = {
    ...celebrity,
    name: normalizeMojibake(celebrity.name),
    facts: normalizeFactsEncoding(celebrity.facts),
  };

  return jsonUtf8({ success: true, celebrity: normalizedCelebrity });
}
