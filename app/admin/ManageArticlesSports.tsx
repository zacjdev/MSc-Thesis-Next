'use client';

import { useEffect, useState } from 'react';

type Sport = {
  name: string;
  description?: string;
  slug: string;
  _id?: string;
};

type Article = {
  title: string;
  sportSlug: string;
  content: string; // markdown
  _id?: string;
};

export default function SportsArticlesManager() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  const [expanded, setExpanded] = useState({ sports: true, articles: false });

  // Editing states
  const [editSport, setEditSport] = useState<Sport | null>(null);
  const [editArticle, setEditArticle] = useState<Article | null>(null);

  const [sportForm, setSportForm] = useState({ name: '', description: '' });
  const [articleForm, setArticleForm] = useState({ title: '', sportSlug: '', content: '' });

  const [search, setSearch] = useState({ sports: '', articles: '' });

  // Fetch sports and articles on mount
  useEffect(() => {
    fetchSports();
    fetchArticles();
  }, []);

  async function fetchSports() {
    try {
      const res = await fetch('/api/admin/sports');
      const json = await res.json();
      setSports(json);
    } catch (e) {
      console.error('Failed fetching sports', e);
      setSports([]);
    }
  }

  async function fetchArticles() {
    try {
      const res = await fetch('/api/admin/articles');
      const json = await res.json();
      setArticles(json);
    } catch (e) {
      console.error('Failed fetching articles', e);
      setArticles([]);
    }
  }

  // Handle expanding/collapsing sections
  const toggleSection = (section: 'sports' | 'articles') => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sport form handlers
  const startEditSport = (sport: Sport | null = null) => {
    setEditSport(sport);
    setSportForm({
      name: sport?.name || '',
      description: sport?.description || '',
    });
  };

  const handleSportFormChange = (field: keyof typeof sportForm, value: string) => {
    setSportForm((f) => ({ ...f, [field]: value }));
  };

  // Article form handlers
  const startEditArticle = (article: Article | null = null) => {
    setEditArticle(article);
    setArticleForm({
      title: article?.title || '',
      sportSlug: article?.sportSlug || '',
      content: article?.content || '',
    });
  };

  const handleArticleFormChange = (field: keyof typeof articleForm, value: string) => {
    setArticleForm((f) => ({ ...f, [field]: value }));
  };

  // Save sport (POST /api/admin/sports)
  const saveSport = async () => {
    if (!sportForm.name.trim()) {
      alert('Sport name is required');
      return;
    }
  
    const payload = { ...sportForm };
    const url = editSport?._id
      ? `/api/admin/sports/${editSport._id}`
      : '/api/admin/sports';
    const method = editSport?._id ? 'PUT' : 'POST';
  
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
  
      if (!json.success) {
        alert('Error saving sport: ' + (json.error || 'Unknown error'));
        return;
      }
  
      alert('Sport saved');
      startEditSport(null);
      await fetchSports();
    } catch (e) {
      alert('Failed saving sport');
      console.error(e);
    }
  };

  const deleteSport = async (sport: Sport) => {
    if (!sport._id || !confirm(`Delete sport "${sport.name}"?`)) return;
  
    try {
      const res = await fetch(`/api/admin/sports/${sport._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
  
      if (!json.success) {
        alert('Error deleting sport: ' + (json.error || 'Unknown error'));
        return;
      }
  
      alert('Sport deleted');
      await fetchSports();
    } catch (e) {
      alert('Failed deleting sport');
      console.error(e);
    }
  };

  // Save article (POST /api/admin/articles)
  const saveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.sportSlug.trim() || !articleForm.content.trim()) {
      alert('Title, sport, and content are required');
      return;
    }
  
    const payload = { ...articleForm };
    const url = editArticle?._id
      ? `/api/admin/articles/${editArticle._id}`
      : '/api/admin/articles';
    const method = editArticle?._id ? 'PUT' : 'POST';
  
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
  
      if (!json.success) {
        alert('Error saving article: ' + (json.error || 'Unknown error'));
        return;
      }
  
      alert('Article saved');
      startEditArticle(null);
      await fetchArticles();
    } catch (e) {
      alert('Failed saving article');
      console.error(e);
    }
  };

  const deleteArticle = async (article: Article) => {
    if (!article._id || !confirm(`Delete article "${article.title}"?`)) return;
  
    try {
      const res = await fetch(`/api/admin/articles/${article._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
  
      if (!json.success) {
        alert('Error deleting article: ' + (json.error || 'Unknown error'));
        return;
      }
  
      alert('Article deleted');
      await fetchArticles();
    } catch (e) {
      alert('Failed deleting article');
      console.error(e);
    }
  };

  // Filtered lists by search
  const filteredSports = sports.filter((s) =>
    s.name.toLowerCase().includes(search.sports.toLowerCase())
  );
  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(search.articles.toLowerCase())
  );

  return (
    <div className="space-y-10 p-4">
      {/* Sports Section */}
      <div className="border rounded">
        <button
          className="w-full text-left p-4 font-semibold text-lg bg-gray-200 hover:bg-gray-300 rounded-t"
          onClick={() => toggleSection('sports')}
        >
          {expanded.sports ? '▾' : '▸'} Sports
        </button>
        {expanded.sports && (
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search sports..."
              value={search.sports}
              onChange={(e) => setSearch((s) => ({ ...s, sports: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />

            <ul className="space-y-2 max-h-48 overflow-auto border p-2 rounded bg-white">
              {filteredSports.length > 0 ? (
                filteredSports.map((sport) => (
                  <li
                    key={sport.slug}
                    className="flex justify-between items-center bg-gray-100 p-2 rounded"
                  >
                    <div>
                      <strong>{sport.name}</strong>
                      <p className="text-xs text-gray-600">{sport.description}</p>
                      <small className="text-gray-400">Slug: {sport.slug}</small>
                    </div>
                    <button
  className="text-blue-600 hover:underline"
  onClick={() => startEditSport(sport)}
>
  Edit
</button>
<button
  className="text-red-600 hover:underline ml-4"
  onClick={() => deleteSport(sport)}
>
  Delete
</button>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No sports found.</li>
              )}
            </ul>

            {/* Add/Edit Sport Form */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold">{editSport ? 'Edit Sport' : 'Add New Sport'}</h4>
              <input
                type="text"
                placeholder="Name"
                value={sportForm.name}
                onChange={(e) => handleSportFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <textarea
                placeholder="Description (optional)"
                value={sportForm.description}
                onChange={(e) => handleSportFormChange('description', e.target.value)}
                className="w-full px-3 py-2 border rounded resize-y"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                {editSport && (
                  <button
                    onClick={() => startEditSport(null)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={saveSport}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Sport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Articles Section */}
      <div className="border rounded">
        <button
          className="w-full text-left p-4 font-semibold text-lg bg-gray-200 hover:bg-gray-300 rounded-t"
          onClick={() => toggleSection('articles')}
        >
          {expanded.articles ? '▾' : '▸'} Articles
        </button>
        {expanded.articles && (
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search articles..."
              value={search.articles}
              onChange={(e) => setSearch((s) => ({ ...s, articles: e.target.value }))}
              className="w-full px-3 py-2 border rounded text-sm"
            />

            <ul className="space-y-2 max-h-48 overflow-auto border p-2 rounded bg-white">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <li
                    key={article._id || article.title}
                    className="flex justify-between items-center bg-gray-100 p-2 rounded"
                  >
                    <div>
                      <strong>{article.title}</strong>
                      <p className="text-xs text-gray-600">Sport: {article.sportSlug}</p>
                      <small className="text-gray-400 truncate block max-w-xs">{article.content.slice(0, 50)}...</small>
                    </div>
                    <button
  className="text-blue-600 hover:underline"
  onClick={() => startEditArticle(article)}
>
  Edit
</button>
<button
  className="text-red-600 hover:underline ml-4"
  onClick={() => deleteArticle(article)}
>
  Delete
</button>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No articles found.</li>
              )}
            </ul>

            {/* Add/Edit Article Form */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold">{editArticle ? 'Edit Article' : 'Add New Article'}</h4>
              <input
                type="text"
                placeholder="Title"
                value={articleForm.title}
                onChange={(e) => handleArticleFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />

              <select
                value={articleForm.sportSlug}
                onChange={(e) => handleArticleFormChange('sportSlug', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select related sport</option>
                {sports.map((sport) => (
                  <option key={sport.slug} value={sport.slug}>
                    {sport.name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Content (markdown supported)"
                value={articleForm.content}
                onChange={(e) => handleArticleFormChange('content', e.target.value)}
                className="w-full px-3 py-2 border rounded resize-y font-mono text-sm"
                rows={8}
              />

              <div className="flex justify-end gap-2">
                {editArticle && (
                  <button
                    onClick={() => startEditArticle(null)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={saveArticle}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Article
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
