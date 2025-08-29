import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/games:
 *   get:
 *     summary: Get merged list of games
 *     description: >
 *       Retrieve a combined list of games from the base `games` collection and the
 *       `games_override` collection. Overrides replace matching base games by `hash`.  
 *       New override games (not present in base) are also included.
 *     tags:
 *       - Games
 *     responses:
 *       200:
 *         description: List of merged games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hash:
 *                     type: string
 *                     description: Unique identifier for the game
 *                   homeTeam:
 *                     type: string
 *                     description: Name of the home team
 *                   awayTeam:
 *                     type: string
 *                     description: Name of the away team
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Game date and time
 *                   [otherProps]:
 *                     description: Any additional game fields from the database
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

    const [baseGames, overrideGames] = await Promise.all([
      db.collection('games').find({}).toArray(),
      db.collection('games_override').find({}).toArray(),
    ]);

    const overrideMap = new Map(overrideGames.map(game => [game.hash, game]));

    const mergedGames = baseGames.map(game =>
      overrideMap.get(game.hash) ?? game
    );

    const baseHashes = new Set(baseGames.map(game => game.hash));
    const newOverrides = overrideGames.filter(game => !baseHashes.has(game.hash));

    return NextResponse.json([...mergedGames, ...newOverrides]);
  } catch (error: any) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}