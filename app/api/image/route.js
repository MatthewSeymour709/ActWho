import { NextResponse } from "next/server";

// Simple in-memory cache (for demo; use Redis or similar for production)
const imageCache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) {
    return NextResponse.json(
      { error: "Missing name parameter" },
      { status: 400 },
    );
  }

  // Check cache first
  if (imageCache.has(name)) {
    return NextResponse.json({ imageUrl: imageCache.get(name) });
  }

  // Wikipedia API fetch (server-side)
  try {
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      name,
    )}&prop=pageimages&pithumbsize=150&format=json&origin=*`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return NextResponse.json({ imageUrl: null });
    }
    const data = await response.json();
    const pages = data.query?.pages;
    let imageUrl = null;
    if (pages) {
      const page = Object.values(pages)[0];
      imageUrl = page.thumbnail?.source || null;
    }
    // Cache result (even if null)
    imageCache.set(name, imageUrl);
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
