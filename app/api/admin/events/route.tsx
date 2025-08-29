import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/events:
 *   get:
 *     summary: Get merged list of events
 *     description: >
 *       Retrieve a combined list of events from the base `events` collection and the
 *       `events_override` collection. Overrides replace matching base events by `hash`.  
 *       New override events (not present in base) are also included.
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: List of merged events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hash:
 *                     type: string
 *                     description: Unique identifier for the event
 *                   name:
 *                     type: string
 *                     description: Event name
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Event date and time
 *                   [otherProps]:
 *                     description: Any additional event fields from the database
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('myappdb');

    const [baseEvents, overrideEvents] = await Promise.all([
      db.collection('events').find({}).toArray(),
      db.collection('events_override').find({}).toArray(),
    ]);

    const overrideMap = new Map(overrideEvents.map(event => [event.hash, event]));

    const mergedEvents = baseEvents.map(event =>
      overrideMap.get(event.hash) ?? event
    );

    const baseHashes = new Set(baseEvents.map(event => event.hash));
    const newOverrides = overrideEvents.filter(event => !baseHashes.has(event.hash));

    return NextResponse.json([...mergedEvents, ...newOverrides]);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}