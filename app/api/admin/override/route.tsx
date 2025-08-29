import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/override:
 *   post:
 *     summary: Create or update an override entry
 *     description: >
 *       Add or update an override document in the corresponding `{collection}_override` collection.  
 *       If a document with the given `hash` exists, it will be updated.  
 *       Otherwise, a new one will be inserted (upsert).
 *     tags:
 *       - Overrides
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collection
 *               - hash
 *               - data
 *             properties:
 *               collection:
 *                 type: string
 *                 example: "games"
 *                 description: Base collection name (e.g., `games`, `events`, `clubs`)
 *               hash:
 *                 type: string
 *                 description: Unique identifier of the entity being overridden
 *                 example: "abc123hash"
 *               data:
 *                 type: object
 *                 description: Override fields to apply
 *                 example:
 *                   name: "Custom Club Name"
 *                   date: "2025-08-20T19:00:00Z"
 *     responses:
 *       200:
 *         description: Successfully created or updated override
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *                   description: MongoDB update result
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collection, hash, data } = await req.json();
    const client = await clientPromise;
    const db = client.db('myappdb');

    if (!collection || !hash || !data) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await db.collection(`${collection}_override`).updateOne(
      { hash },
      { $set: { ...data, hash } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Error updating override:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}