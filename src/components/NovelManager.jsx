import React, { useState } from 'react';

export default function NovelManager({
  novels,
  currentNovelId,
  onLoad,
  onCreate,
  onDelete,
  onRename,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEdit = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const saveEdit = (id) => {
    if (editingTitle.trim()) {
      onRename(id, editingTitle);
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <button
        onClick={() => onCreate('New Novel')}
        className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold transition"
      >
        ➕ New Novel
      </button>

      {novels.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No novels yet</p>
      ) : (
        novels.map((novel) => (
          <div
            key={novel.id}
            className={`p-3 rounded-lg cursor-pointer transition ${
              currentNovelId === novel.id
                ? 'bg-purple-600 border border-purple-500'
                : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
            }`}
          >
            {editingId === novel.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => saveEdit(novel.id)}
                    className="flex-1 bg-green-600 px-2 py-1 rounded text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-600 px-2 py-1 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div onClick={() => onLoad(novel.id)} className="mb-2">
                  <p className="font-semibold text-sm truncate">
                    {novel.title}
                  </p>
                  <p className="text-xs text-gray-300">
                    {novel.wordCount} words • {new Date(novel.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(novel.id, novel.title)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-semibold transition"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={() => onDelete(novel.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-semibold transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
