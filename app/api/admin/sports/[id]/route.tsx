import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
/**
 * @openapi
 * /api/admin/sports/{id}:
 *   put:
 *     summary: Update a sport
 *     description: Update the `name` or `description` of a sport by its MongoDB ObjectId.
 *     tags:
 *       - Sports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the sport
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Basketball"
 *               description:
 *                 type: string
 *                 example: "A team sport played on a court with a hoop."
 *     responses:
 *       200:
 *         description: Successfully updated
 *       404:
 *         description: Sport not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a sport
 *     description: Delete a sport by its MongoDB ObjectId.
 *     tags:
 *       - Sports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the sport
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       404:
 *         description: Sport not found
 *       500:
 *         description: Server error
 */
xport async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = context.params;
    const body = await req.json();
    const { name, description } = body;

    const client = await clientPromise;
    const db = client.db('myappdb');
    const collection = db.collection('sports');

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating sport:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = context.params;

    const client = await clientPromise;
    const db = client.db('myappdb');
    const collection = db.collection('sports');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sport:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}