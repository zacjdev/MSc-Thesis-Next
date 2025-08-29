'use client';

import { useEffect, useState } from 'react';

type CollectionType = 'events' | 'clubs' | 'games';
type Entry = { hash: string; [key: string]: any };

const collections: CollectionType[] = ['events', 'clubs', 'games'];

export default function AdminPanel() {
  const [data, setData] = useState<Record<CollectionType, Entry[]>>({
    events: [],
    clubs: [],
    games: [],
  });
  const [editItem, setEditItem] = useState<Entry | null>(null);
  const [editType, setEditType] = useState<CollectionType | ''>('');
  const [formData, setFormData] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<CollectionType, boolean>>({
    events: true,
    clubs: false,
    games: false,
  });
  const [search, setSearch] = useState<Record<CollectionType, string>>({
    events: '',
    clubs: '',
    games: '',
  });

  const fetchAll = async () => {
    const result: any = {};
    for (const col of collections) {
      try {
        const res = await fetch(`/api/admin/${col}`);
        const text = await res.text();
        result[col] = text.startsWith('<') ? [] : JSON.parse(text);
      } catch (err) {
        console.error(`Error fetching ${col}:`, err);
        result[col] = [];
      }
    }

    // Sort specific collections
    result.events = result.events.sort((a: Entry, b: Entry) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    result.clubs = result.clubs.sort((a: Entry, b: Entry) =>
      (a.name || a.title || '').localeCompare(b.name || b.title || '')
    );

    setData(result);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEdit = (item: Entry, type: CollectionType) => {
    setEditItem(item);
    setEditType(type);
    try {
      setFormData(JSON.stringify(item, null, 2));
    } catch {
      setFormData('{}');
    }
  };

  const handleSave = async () => {
    if (!editItem || !editType) return;

    try {
      const parsed = JSON.parse(formData);
      const res = await fetch('/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: editType,
          hash: editItem.hash,
          data: parsed,
        }),
      });

      const responseText = await res.text();
      if (!res.ok) {
        console.error('Save failed:', responseText);
        alert('Save failed.');
        return;
      }

      alert('Override saved.');
      setEditItem(null);
      await fetchAll(); // refresh
    } catch (err) {
      console.error('Invalid JSON on save:', err);
      alert('Invalid JSON. Fix the format before saving.');
    }
  };

  const isJsonValid = (() => {
    try {
      JSON.parse(formData);
      return true;
    } catch {
      return false;
    }
  })();

  const toggleSection = (type: CollectionType) => {
    setExpanded((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSearchChange = (col: CollectionType, value: string) => {
    setSearch((prev) => ({ ...prev, [col]: value }));
  };


  const handleReset = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URI}/run-scraper`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ el: true, semla: true, sewla: true }) }
      );

      if (!res.ok) {
        const txt = await res.text();
        console.error('Reset failed:', txt);
        alert('Reset failed.');
        return;
      }

      alert('Reset and scraper triggered.');
      await fetchAll();
    } catch (err) {
      console.error('Error during reset:', err);
      alert('Error connecting to scraper API.');
    }
  };

  return (
    <div className="space-y-10 p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reset All
        </button>
      </div>

      {collections.map((col) => {
        const searchQuery = search[col].toLowerCase();
        const filtered = data[col].filter((item) => {
          const str = (item.name || item.title || '').toLowerCase();
          return str.includes(searchQuery);
        });

        return (
          <div key={col} className="border rounded">
            <button
              onClick={() => toggleSection(col)}
              className="w-full text-left p-4 font-semibold text-lg capitalize bg-gray-200 hover:bg-gray-300 rounded-t"
            >
              {expanded[col] ? '▾' : '▸'} {col}
            </button>

            {expanded[col] && (
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search[col]}
                  onChange={(e) => handleSearchChange(col, e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                />

<ul className="space-y-2">
  {filtered.length > 0 ? (
    filtered.map((item) => (
      <li
        key={item.hash}
        className="flex justify-between items-center bg-gray-100 p-3 rounded"
      >
        <div>
          <strong>{item.name || item.title || item.homeTeamName + " vs " + item.awayTeamName}</strong>
          <span className="ml-2 text-sm text-gray-500">({item.hash})</span>
        </div>
        <button
          onClick={() => handleEdit(item, col)}
          className="text-blue-600 hover:underline"
        >
          Edit
        </button>
      </li>
    ))
  ) : (
    <li className="text-gray-500 italic">No results found.</li>
  )}
</ul>
              </div>
            )}
          </div>
        );
      })}

      {editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-2">
              Editing {editType} — {editItem.hash}
            </h3>
            <textarea
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              rows={15}
              className="w-full border p-2 font-mono text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isJsonValid}
                className={`px-4 py-2 rounded ${
                  isJsonValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
