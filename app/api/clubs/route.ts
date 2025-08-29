// diss-app/app/api/clubs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * @openapi
 * /api/clubs:
 *   get:
 *     summary: Fetch clubs with optional filtering, location, and pagination
 *     tags:
 *       - Clubs
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter clubs by sport slug (case-insensitive). Use "all" for no filter.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter clubs by name (partial match).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Pagination page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           example: "40.7128,-74.0060"
 *         description: Latitude and longitude to filter nearby clubs.
 *       - in: query
 *         name: distance
 *         schema:
 *           type: number
 *           default: 0
 *         description: Distance in miles to filter clubs near the location.
 *     responses:
 *       200:
 *         description: Array of clubs merged with overrides.
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Server error.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const location = searchParams.get('location') || '';
    const distance = parseInt(searchParams.get('distance') || '0', 10);

    const client = await clientPromise;
    const db = client.db('myappdb');

    // Base query (ignore location for now)
    const query: any = {};
    if (sport && sport.toLowerCase() !== 'all') {
      query.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    }
    if (search) {
      query.name = { $regex: new RegExp(search, 'i') };
    }

    let baseClubs = await db.collection('clubs').find(query).toArray();

    // Filter by location + distance manually
    if (location && distance > 0) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        const maxDistMeters = distance * 1609.34;
        baseClubs = baseClubs.filter(club => {
          if (club.location?.lat != null && club.location?.long != null) {
            const d = haversineDistance(lat, lng, club.location.lat, club.location.long);
            return d <= maxDistMeters;
          }
          return false;
        });
      }
    }

    // Pagination
    const paginatedClubs = baseClubs.slice((page - 1) * limit, page * limit);

    // Override collection
    const overrideClubs = await db.collection('clubs_override').find({}).toArray();
    const overrideMap = new Map(overrideClubs.map(club => [club.hash, club]));
    const mergedClubs = paginatedClubs.map(club => overrideMap.get(club.hash) ?? club);

    const baseHashes = new Set(paginatedClubs.map(club => club.hash));
    const newOverrides = overrideClubs.filter(club => !baseHashes.has(club.hash));

    return NextResponse.json([...mergedClubs, ...newOverrides]);
  } catch (err: any) {
    console.error('Error fetching clubs:', err.message || err);
    return NextResponse.json(
      { error: 'Failed to fetch clubs. Check location format and 2dsphere index.' },
      { status: 500 }
    );
  }
}

// Haversine helper
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(req: NextRequest) {
  // Check ?key= in query params
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (key !== process.env.PYTHON_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clubs = await req.json();

    if (!clubs || (Array.isArray(clubs) && clubs.length === 0)) {
      return NextResponse.json({ success: false, error: "No clubs provided" }, { status: 400 });
    }

    // Normalize input to array
    const clubsArray = Array.isArray(clubs) ? clubs : [clubs];

    // Filter out duplicates by hash
    const uniqueClubsMap = new Map<string, any>();
    for (const club of clubsArray) {
      if (!club.hash) {
        return NextResponse.json(
          { success: false, error: "Each club must have a hash field" },
          { status: 400 }
        );
      }
      if (!uniqueClubsMap.has(club.hash)) {
        uniqueClubsMap.set(club.hash, club);
      }
    }
    const uniqueClubs = Array.from(uniqueClubsMap.values());

    const client = await clientPromise;
    const db = client.db("myappdb");
    const collection = db.collection("clubs");

    // Delete existing clubs with matching hashes
    const hashesToDelete = uniqueClubs.map((c) => c.hash);
    await collection.deleteMany({ hash: { $in: hashesToDelete } });

    // Insert unique clubs
    let insertedCount = 0;
    if (uniqueClubs.length > 1) {
      const result = await collection.insertMany(uniqueClubs);
      insertedCount = Object.keys(result.insertedIds).length;
    } else if (uniqueClubs.length === 1) {
      await collection.insertOne(uniqueClubs[0]);
      insertedCount = 1;
    }

    return NextResponse.json({ success: true, insertedCount });
  } catch (error: any) {
    console.error("Error saving clubs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}