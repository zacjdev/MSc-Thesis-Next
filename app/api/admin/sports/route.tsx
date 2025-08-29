import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/sports:
 *   get:
 *     summary: Get all sports
 *     description: Retrieve all sports from the database, sorted by name in ascending order.
 *     tags:
 *       - Sports
 *     responses:
 *       200:
 *         description: List of sports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: MongoDB ObjectId
 *                   name:
 *                     type: string
 *                     example: "Basketball"
 *                   description:
 *                     type: string
 *                     example: "A team sport played on a court with a hoop."
 *                   slug:
 *                     type: string
 *                     example: "basketball"
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create or update a sport
 *     description: Insert a new sport or update an existing one by slug or name (upsert).
 *     tags:
 *       - Sports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Soccer"
 *               description:
 *                 type: string
 *                 example: "A globally popular sport played with a ball and two goals."
 *               slug:
 *                 type: string
 *                 example: "soccer"
 *     responses:
 *       200:
 *         description: Successfully created or updated
 *       400:
 *         description: Missing required fields
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
    const sports = await db.collection('sports').find({}).sort({ name: 1 }).toArray();
    return NextResponse.json(sports);
  } catch (error: any) {
    console.error('Error fetching sports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sport = await req.json();

    if (!sport.name) {
      return NextResponse.json({ success: false, error: 'sport must have a name' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('myappdb');
    const collection = db.collection('sports');

    const filter = sport.slug ? { slug: sport.slug } : { name: sport.name };
    const update = { $set: sport };
    const options = { upsert: true };

    await collection.updateOne(filter, update, options);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving sport:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}