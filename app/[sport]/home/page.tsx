"use client";

import placeholder from "./placeholder.webp";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Article {
  _id: string;
  title: string;
  content: string;
}

export default function SportPage() {
  const { sport } = useParams<{ sport: string }>();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      const res = await fetch(`/api/admin/articles?sport=${sport}`);
      const data = await res.json();
      setArticles(data);
    }
    fetchArticles();
  }, [sport]);

  // Function to get a snippet of the content
  const getSnippet = (content: string) => {
    if (!content) return "";
    return content.length > 120 ? content.slice(0, 120) + "..." : content;
  };

  function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{capitalizeFirstLetter(sport)} articles</h1>

      {articles.length === 0 ? (
        <p className="text-gray-600">No articles found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <Link key={article._id} href={`/article/${article._id}`} className="group">
              <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300 bg-white">
                <Image
        src={placeholder}
        alt={article.title}
        className="w-full h-48 object-cover"
      />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-gray-500 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-600 text-sm">
                    {getSnippet(article.content)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
