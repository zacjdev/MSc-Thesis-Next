import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/reset:
 *   post:
 *     summary: Reset base collections
 *     description: >
 *       Deletes **all documents** from the base collections:  
 *       - `clubs`  
 *       - `events`  
 *       - `games`  
 *       This does not affect their `_override` counterparts.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Successfully cleared collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       collection:
 *                         type: string
 *                         example: "clubs"
 *                       deletedCount:
 *                         type: integer
 *                         example: 42
 *       500:
 *         description: Server error
 */
export async function POST(req: NextRequest) {
  // Extract key from query
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  // Check key is valid
  if (key !== process.env.PYTHON_API_KEY) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("myappdb");

    const collections = ["clubs", "events", "games"];

    const results = await Promise.all(
      collections.map(async (col) => {
        const res = await db.collection(col).deleteMany({});
        return { collection: col, deletedCount: res.deletedCount };
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Error resetting collections:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}