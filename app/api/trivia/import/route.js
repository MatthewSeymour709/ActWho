import clientPromise from "@/utils/mongoDB";
import { celebrityList } from "@/utils/celebrities";
import { getCelebrityImage, getCelebrityWithFacts } from "@/utils/wikipedia";
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

const TOTAL_CELEBRITIES = celebrityList.length;

async function getCelebritiesCollection() {
  const client = await clientPromise;
  const db = client.db("trivia_game");
  return db.collection("celebrities");
}

async function ensureCelebritiesIndexes(collection) {
  await Promise.all([
    collection.createIndex({ name: 1 }, { unique: true }),
    collection.createIndex(
      { celebId: 1 },
      {
        unique: true,
        partialFilterExpression: { celebId: { $type: "number" } },
      },
    ),
  ]);
}

async function upsertCelebrity(record) {
  const celebritiesCollection = await getCelebritiesCollection();
  const normalizedName = normalizeMojibake(record.name);
  const normalizedFacts = normalizeFactsEncoding(record.facts);

  await celebritiesCollection.updateOne(
    { celebId: record.celebId },
    {
      $set: {
        name: normalizedName,
        celebId: record.celebId,
        facts: normalizedFacts,
        imageUrl: record.imageUrl,
        source: "wikipedia",
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
  const celebritiesCollection = await getCelebritiesCollection();

  await ensureCelebritiesIndexes(celebritiesCollection);

  const listFilter = {
    source: "wikipedia",
    name: { $in: celebrityList },
  };

  const [importedCount, withImagesCount, latest] = await Promise.all([
    celebritiesCollection.countDocuments(listFilter),
    celebritiesCollection.countDocuments({
      ...listFilter,
      imageUrl: { $ne: null },
    }),
    celebritiesCollection
      .find(listFilter)
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray(),
  ]);

  const extraRecordsCount = await celebritiesCollection.countDocuments({
    source: "wikipedia",
    name: { $nin: celebrityList },
  });

  return jsonUtf8({
    success: true,
    totalRequested: TOTAL_CELEBRITIES,
    idRange: {
      start: 1,
      end: TOTAL_CELEBRITIES,
    },
    importedCount,
    missingCount: Math.max(0, TOTAL_CELEBRITIES - importedCount),
    withImagesCount,
    withoutImagesCount: Math.max(0, importedCount - withImagesCount),
    extraRecordsCount,
    lastUpdatedAt: latest[0]?.updatedAt || null,
  });
}

export async function POST() {
  const celebritiesCollection = await getCelebritiesCollection();
  await ensureCelebritiesIndexes(celebritiesCollection);

  const startedAt = Date.now();
  const imported = [];
  const skipped = [];

  for (const [index, name] of celebrityList.entries()) {
    try {
      const factsData = await getCelebrityWithFacts(name);
      const imageUrl = await getCelebrityImage(name);

      if (!factsData || !Array.isArray(factsData.facts) || factsData.facts.length === 0) {
        skipped.push({ name, reason: "No facts returned from Wikipedia" });
        continue;
      }

      await upsertCelebrity({
        name: normalizeMojibake(factsData.name),
        celebId: index + 1,
        facts: normalizeFactsEncoding(factsData.facts),
        imageUrl,
      });

      imported.push({
        celebId: index + 1,
        name: normalizeMojibake(factsData.name),
        factsCount: factsData.facts.length,
        hasImage: Boolean(imageUrl),
      });
    } catch (error) {
      skipped.push({ name, reason: error.message || "Unknown error" });
    }
  }

  return jsonUtf8({
    success: true,
    totalRequested: TOTAL_CELEBRITIES,
    importedCount: imported.length,
    skippedCount: skipped.length,
    durationMs: Date.now() - startedAt,
    imported,
    skipped,
  });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const extrasOnly = searchParams.get("extrasOnly");

  if (extrasOnly !== "true") {
    return jsonUtf8(
      {
        success: false,
        error:
          "Refusing to delete records without explicit confirmation. Use ?extrasOnly=true.",
      },
      { status: 400 },
    );
  }

  const celebritiesCollection = await getCelebritiesCollection();

  await ensureCelebritiesIndexes(celebritiesCollection);

  const result = await celebritiesCollection.deleteMany({
    source: "wikipedia",
    name: { $nin: celebrityList },
  });

  return jsonUtf8({
    success: true,
    deletedCount: result.deletedCount,
  });
}
