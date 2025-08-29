import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
/**
 * @openapi
 * /api/sports:
 *   get:
 *     summary: Retrieve a list of all sports
 *     tags:
 *       - Sports
 *     responses:
 *       200:
 *         description: List of sports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: MongoDB document ID
 *                   name:
 *                     type: string
 *                     description: Name of the sport
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db("myappdb");
    const sports = await db.collection("sports").find({}, { projection: { name: 1 } }).toArray();
    return NextResponse.json(sports);
  } catch (error) {
    console.error("Error fetching sports:", error);
    return NextResponse.json({ error: "Failed to fetch sports" }, { status: 500 });
  } finally {
    await client.close();
  }
}
