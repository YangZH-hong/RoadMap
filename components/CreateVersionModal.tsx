'use client';

import React, { useState } from 'react';
import { CategoryKey } from '@/types/roadmap';

const ALL_CATS: { key: CategoryKey; label: string; color: string }[] = [
  { key: 'scenarios', label: '应用场景', color: '#6b8fa3' },
  { key: 'experience', label: '用户体验', color: '#a6835e' },
  { key: 'foundation', label: '基座能力', color: '#8b6f8e' },
  { key: 'performance', label: '性能优化', color: '#6a9b7b' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (version: string, commit: string, visibleCats: CategoryKey[]) => Promise<void>;
}

export function CreateVersionModal({ isOpen, onClose, onCreate }: Props) {
  const [version, setVersion] = useState('');
  const [commit, setCommit] = useState('');
  const [selectedCats, setSelectedCats] = useState<CategoryKey[]>(['scenarios', 'experience', 'foundation', 'performance']);
  const [saving, setSaving] = useState(false);

  const toggleCat = (key: CategoryKey) => {
    setSelectedCats(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || saving || selectedCats.length === 0) return;
    setSaving(true);
    try {
      await onCreate(version.trim(), commit.trim(), selectedCats);
      setVersion('');
      setCommit('');
      setSelectedCats(['scenarios', 'experience', 'foundation', 'performance']);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div
        className="bg-[#fffdf9] rounded-2xl border-2 border-[#8b6f5e] w-full max-w-md p-7 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#3a2e26] mb-5 tracking-wide">创建新版本</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b5b50] mb-1.5">版本号</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="如 2.0"
              required
              autoFocus
              className="w-full px-4 py-2.5 text-base border border-[#d4c4b0] rounded-lg bg-[#f5f0eb] text-[#3a2e26] focus:outline-none focus:ring-1 focus:ring-[#8b6f5e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b5b50] mb-1.5">描述</label>
            <input
              type="text"
              value={commit}
              onChange={e => setCommit(e.target.value)}
              placeholder="版本描述（选填）"
              className="w-full px-4 py-2.5 text-base border border-[#d4c4b0] rounded-lg bg-[#f5f0eb] text-[#3a2e26] focus:outline-none focus:ring-1 focus:ring-[#8b6f5e]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b5b50] mb-2">显示的板块（至少选一个）</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATS.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCat(cat.key)}
                  className={`px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all ${
                    selectedCats.includes(cat.key)
                      ? 'border-[#8b6f5e] bg-[#f5f0eb] text-[#3a2e26]'
                      : 'border-[#e8ddd2] bg-transparent text-[#9c8a7d]'
                  }`}
                >
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ backgroundColor: selectedCats.includes(cat.key) ? cat.color : '#d4c4b0' }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !version.trim() || selectedCats.length === 0}
              className="flex-1 px-5 py-2.5 text-base font-medium bg-[#8b6f5e] text-white rounded-lg hover:bg-[#7a5e4c] disabled:opacity-40 cursor-pointer"
            >
              {saving ? '创建中...' : '创建'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-base border border-[#d4c4b0] rounded-lg text-[#6b5b50] hover:bg-[#f5f0eb] cursor-pointer"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
