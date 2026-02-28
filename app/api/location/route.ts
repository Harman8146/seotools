import { NextResponse } from "next/server";
import { searchCities } from "../../../src/lib/uule";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) return NextResponse.json([]);

  const matches = searchCities(q).slice(0, 8);

  return NextResponse.json(
    matches.map(m =>
      [m.city, m.state, m.countryCode].filter(Boolean).join(", ")
    )
  );
}