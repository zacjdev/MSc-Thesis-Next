import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
/**
 * @openapi
 * /api/games:
 *   post:
 *     summary: Add one or multiple games to the database
 *     tags:
 *       - Games
 *     requestBody:
 *       description: Game object or array of game objects to insert
 *       required: true
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: Games inserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 insertedCount:
 *                   type: integer
 *       400:
 *         description: Invalid input, missing games or hash field
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       required:
 *         - hash
 *       properties:
 *         hash:
 *           type: string
 *           description: Unique hash for the game
 *         name:
 *           type: string
 *           description: Name of the game
 *         sport:
 *           type: string
 *           description: Type of sport
 *         dateStart:
 *           type: integer
 *           description: Start timestamp
 *         dateEnd:
 *           type: integer
 *           description: End timestamp
 *         homeTeamName:
 *           type: string
 *         awayTeamName:
 *           type: string
 *         competitionName:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             lat:
 *               type: number
 *             long:
 *               type: number
 */
export async function POST(req: NextRequest) {
  // Check ?key= in query params
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (key !== process.env.PYTHON_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const games = await req.json();
    console.log("Received games:", JSON.stringify(games, null, 2));

    if (!games || (Array.isArray(games) && games.length === 0)) {
      return NextResponse.json({ success: false, error: "No games provided" }, { status: 400 });
    }

    // Normalize input to array
    const gamesArray = Array.isArray(games) ? games : [games];

    // Filter out duplicates by hash
    const uniqueGamesMap = new Map<string, any>();
    for (const game of gamesArray) {
      if (!game.hash) {
        return NextResponse.json(
          { success: false, error: "Each game must have a hash field" },
          { status: 400 }
        );
      }
      if (!uniqueGamesMap.has(game.hash)) {
        uniqueGamesMap.set(game.hash, game);
      }
    }
    const uniqueGames = Array.from(uniqueGamesMap.values());

    const client = await clientPromise;
    const db = client.db("myappdb");
    const collection = db.collection("games");

    // Delete existing games with matching hashes
    const hashesToDelete = uniqueGames.map((g) => g.hash);
    await collection.deleteMany({ hash: { $in: hashesToDelete } });

    // Insert unique games
    let insertedCount = 0;
    if (uniqueGames.length > 1) {
      const result = await collection.insertMany(uniqueGames);
      insertedCount = Object.keys(result.insertedIds).length;
    } else if (uniqueGames.length === 1) {
      await collection.insertOne(uniqueGames[0]);
      insertedCount = 1;
    }

    return NextResponse.json({ success: true, insertedCount });
  } catch (error: any) {
    console.error("Error saving games:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}