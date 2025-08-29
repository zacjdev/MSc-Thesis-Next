import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Add or update events
 *     tags:
 *       - Clubs
 *     description: |
 *       Accepts a single event object or an array of events.
 *       Events are identified by a unique `hash`. Existing events with the same `hash` are deleted before inserting.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: Successfully inserted events
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
 *         description: Invalid input (empty array or missing hash)
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
export async function POST(req: NextRequest) {
  // Check ?key= in query params
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (key !== process.env.PYTHON_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await req.json();

    if (!events || (Array.isArray(events) && events.length === 0)) {
      return NextResponse.json({ success: false, error: "No events provided" }, { status: 400 });
    }

    // Normalize input to array
    const eventsArray = Array.isArray(events) ? events : [events];

    // Filter out duplicates by hash
    const uniqueEventsMap = new Map<string, any>();
    for (const event of eventsArray) {
      if (!event.hash) {
        return NextResponse.json(
          { success: false, error: "Each event must have a hash field" },
          { status: 400 }
        );
      }
      if (!uniqueEventsMap.has(event.hash)) {
        uniqueEventsMap.set(event.hash, event);
      }
    }
    const uniqueEvents = Array.from(uniqueEventsMap.values());

    const client = await clientPromise;
    const db = client.db("myappdb");
    const collection = db.collection("events");

    // Delete existing events with matching hashes
    const hashesToDelete = uniqueEvents.map((e) => e.hash);
    await collection.deleteMany({ hash: { $in: hashesToDelete } });

    // Insert unique events
    let insertedCount = 0;
    if (uniqueEvents.length > 1) {
      const result = await collection.insertMany(uniqueEvents);
      insertedCount = Object.keys(result.insertedIds).length;
    } else if (uniqueEvents.length === 1) {
      await collection.insertOne(uniqueEvents[0]);
      insertedCount = 1;
    }

    return NextResponse.json({ success: true, insertedCount });
  } catch (error: any) {
    console.error("Error saving events:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}