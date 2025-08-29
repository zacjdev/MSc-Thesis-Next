import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/clubs:
 *   get:
 *     summary: Get merged list of clubs
 *     description: >
 *       Retrieve a combined list of clubs from the base `clubs` collection and the
 *       `clubs_override` collection. Overrides replace matching base clubs by `hash`.  
 *       New override clubs (not present in base) are also included.
 *     tags:
 *       - Clubs
 *     responses:
 *       200:
 *         description: List of merged clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hash:
 *                     type: string
 *                     description: Unique identifier for the club
 *                   name:
 *                     type: string
 *                     description: Club name
 *                   [otherProps]:
 *                     description: Any additional club fields from the database
 *       500:
 *         description: Server error
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('myappdb');

    const [baseClubs, overrideClubs] = await Promise.all([
      db.collection('clubs').find({}).toArray(),
      db.collection('clubs_override').find({}).toArray(),
    ]);

    const overrideMap = new Map(overrideClubs.map(club => [club.hash, club]));

    const mergedClubs = baseClubs.map(club =>
      overrideMap.get(club.hash) ?? club
    );

    const baseHashes = new Set(baseClubs.map(club => club.hash));
    const newOverrides = overrideClubs.filter(club => !baseHashes.has(club.hash));

    return NextResponse.json([...mergedClubs, ...newOverrides]);
  } catch (error: any) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}