import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ReactMarkdown from "react-markdown";

interface ArticlePageProps {
  params: { id: string };
}
/**
 * @openapi
 * /api/articles/{id}:
 *   get:
 *     summary: Retrieve a single article by ID
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The MongoDB ObjectId of the article
 *     responses:
 *       200:
 *         description: Article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: Article MongoDB ID
 *                 title:
 *                   type: string
 *                   description: Article title
 *                 content:
 *                   type: string
 *                   description: Markdown content of the article
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Article not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch article"
 */
export default async function ArticlePage({ params: { id } }: ArticlePageProps) {
  const client = await clientPromise;
  const db = client.db("myappdb");

  const article = await db
    .collection("articles")
    .findOne({ _id: new ObjectId(id) });

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="p-6 markdown-container">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <div className="markdown">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </div>
  );
}
