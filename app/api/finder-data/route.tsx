// app/api/finder-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
/**
 * @openapi
 * /api/finder-data:
 *   get:
 *     summary: Retrieve events and games with filters
 *     description: |
 *       Returns a combined list of events and games, supporting filtering by sport, category, date range, time (upcoming/past), search, location, and distance.
 *       Results can be sorted and paginated.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term applied to name, category, home/away teams, or competition.
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *           default: "all"
 *         description: Filter by sport name.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: integer
 *         description: Filter items starting after this UNIX timestamp.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: integer
 *         description: Filter items ending before this UNIX timestamp.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "dateStart_asc"
 *         description: Sorting option (e.g., dateStart_asc, distance_desc, name_asc).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page.
 *       - in: query
 *         name: includeEvents
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include events in the response.
 *       - in: query
 *         name: includeGames
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include games in the response.
 *       - in: query
 *         name: timeFilter
 *         schema:
 *           type: string
 *           enum: [upcoming, past, ""]
 *         description: Filter by upcoming or past items.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location string to geocode for distance filtering.
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *         description: Maximum distance in miles from the location.
 *     responses:
 *       200:
 *         description: Paginated list of events and games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
// Simple Haversine formula in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // radius of Earth in miles
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}


// Placeholder geocoding function
async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "myapp/1.0 (myemail@example.com)" }, // Nominatim requires identifying header
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Error geocoding location:", err);
    return null;
  }
}

function mergeWithOverrides(base: any[], overrides: any[]) {
  const overrideMap = new Map(overrides.map((doc) => [doc.hash, doc]));
  const merged = base.map((doc) => overrideMap.get(doc.hash) ?? doc);
  const baseHashes = new Set(base.map((doc) => doc.hash));
  const newOverrides = overrides.filter((doc) => !baseHashes.has(doc.hash));
  return [...merged, ...newOverrides];
}

export async function GET(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db("myappdb");

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const {
    search,
    sport,
    sort = "dateStart_asc",
    category,
    startDate,
    endDate,
    page = "1",
    limit = "20",
    includeEvents = "true",
    includeGames = "true",
    timeFilter = "",
    location,
    distance,
  } = params;

  const limitNum = Math.max(1, parseInt(limit));
  const pageNum = Math.max(1, parseInt(page));

  // Collections
  const [baseEvents, overrideEvents] = await Promise.all([
    db.collection("events").find({}).toArray(),
    db.collection("events_override").find({}).toArray(),
  ]);

  const mergedEvents = mergeWithOverrides(baseEvents, overrideEvents);

  const [baseGames, overrideGames] = await Promise.all([
    db.collection("games").find({}).toArray(),
    db.collection("games_override").find({}).toArray(),
  ]);

  const mergedGames = mergeWithOverrides(baseGames, overrideGames);

  // Combine into one dataset
  let results: any[] = [];
  if (includeEvents === "true") results.push(...mergedEvents);
  if (includeGames === "true") results.push(...mergedGames);

  // Filter by sport
  if (sport && sport.toLowerCase() !== "all") {
    results = results.filter(
      (item) => item.sport?.toLowerCase() === sport.toLowerCase()
    );
  }

  // Filter by category
  if (category) {
    results = results.filter(
      (item) => item.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by date range
  if (startDate || endDate) {
    const start = startDate ? parseInt(startDate) : 0;
    const end = endDate ? parseInt(endDate) : Number.MAX_SAFE_INTEGER;
    results = results.filter(
      (item) =>
        (item.dateStart ?? 0) >= start && (item.dateEnd ?? 0) <= end
    );
  }

  // Time filter (upcoming / past)
  const now = Math.floor(Date.now() / 1000);
  if (timeFilter === "upcoming") {
    results = results.filter((item) => item.dateStart >= now);
  } else if (timeFilter === "past") {
    results = results.filter((item) => item.dateStart < now);
  }

  // Search by name/home/away/competition
  if (search) {
    const q = search.toLowerCase();
    results = results.filter((item) =>
      [
        item.name,
        item.category,
        item.homeTeamName,
        item.awayTeamName,
        item.competitionName,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }

  // Location search + distance filter
  let userLat: number | null = null;
  let userLng: number | null = null;
  if (location) {
    const coords = await geocodeLocation(location);
    if (coords) {
      userLat = coords.lat;
      userLng = coords.lng;
      results = results.map((item) => {
        const lat = item.location?.lat;
        const lng = item.location?.long;
        if (lat != null && lng != null) {
          item._distance = haversine(userLat!, userLng!, lat, lng);
        } else {
          item._distance = Infinity;
        }
        return item;
      });
      if (distance) {
        const distNum = parseFloat(distance);
        results = results.filter((item) => (item._distance ?? Infinity) <= distNum);
      }
    }
  }

  // Sorting
  if (sort === "distance_asc") {
    results.sort((a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity));
  } else if (sort === "distance_desc") {
    results.sort((a, b) => (b._distance ?? -Infinity) - (a._distance ?? -Infinity));
  } else if (sort.startsWith("name_")) {
    const dir = sort.endsWith("asc") ? 1 : -1;
    results.sort((a, b) => {
      const nameA = a.name ?? `${a.homeTeamName} vs ${a.awayTeamName}`;
      const nameB = b.name ?? `${b.homeTeamName} vs ${b.awayTeamName}`;
      return nameA.localeCompare(nameB) * dir;
    });
  } else {
    const [field, direction] = sort.split("_");
    results.sort((a, b) => {
      const valA = a[field] ?? 0;
      const valB = b[field] ?? 0;
      return direction === "desc" ? valB - valA : valA - valB;
    });
  }

  // Pagination
  const total = results.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedResults = results.slice(startIndex, startIndex + limitNum);

  return NextResponse.json({
    total,
    page: pageNum,
    pageSize: limitNum,
    totalPages: Math.ceil(total / limitNum),
    data: paginatedResults,
  });
}
