import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";
/**
 * @openapi
 * /api/articles:
 *   get:
 *     summary: Get articles (optionally filtered by sport)
 *     description: >
 *       Retrieve all articles from the database.  
 *       Optionally filter results by `sport` query parameter (case-insensitive).  
 *       If `sport=all` or no parameter is provided, all articles are returned.
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: query
 *         name: sport
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter articles by sport slug (case-insensitive). Use "all" or omit to return everything.
 *         example: "soccer"
 *     responses:
 *       200:
 *         description: List of articles
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
 *                   title:
 *                     type: string
 *                     example: "Match Recap"
 *                   content:
 *                     type: string
 *                     example: "A detailed recap of yesterday's game."
 *                   sportSlug:
 *                     type: string
 *                     example: "soccer"
 *       500:
 *         description: Server error
 */
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('myappdb');

    // Read query parameter from the URL
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport')?.toLowerCase() || 'all';

    // Build filter
    const filter =
      sport === 'all'
        ? {}
        : { sportSlug: { $regex: `^${sport}$`, $options: 'i' } }; // case-insensitive exact match

    const articles = await db
      .collection('articles')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(articles);
  } catch (err: any) {
    console.error('Error fetching articles:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ await params
    const { title, content, sportSlug } = await req.json();

    const client = await clientPromise;
    const db = client.db('myappdb');

    const result = await db.collection('articles').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          content,
          sportSlug,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating article:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const article = await req.json();
    if (!article.title || !article.sportSlug || !article.content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('myappdb');
    const now = new Date();

    const result = await db.collection('articles').insertOne({
      title: article.title,
      sportSlug: article.sportSlug,
      content: article.content,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
