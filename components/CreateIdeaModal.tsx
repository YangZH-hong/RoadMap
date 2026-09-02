'use client';

import React, { useState } from 'react';
import { IdeaItem } from '@/types/roadmap';

interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: IdeaItem) => void;
}

export function CreateIdeaModal({ isOpen, onClose, onAdd }: CreateIdeaModalProps) {
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd({
      id: '',
      content: content.trim(),
      status: 'Ideas',
      category: 'Uncategorized',
    });
    setContent('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3a2e26]/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-[#fffdf9] border-[2px] border-[#d4c4b0] p-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e8ddd2]">
          <h3 className="text-base font-medium text-[#3a2e26] tracking-wide">新灵感 / 需求</h3>
          <button onClick={onClose} className="text-[#9c8a7d] hover:text-[#3a2e26] text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            rows={5}
            required
            autoFocus
            placeholder="描述你的想法或需求...&#10;&#10;按 Enter 提交，Shift+Enter 换行，Esc 关闭"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 text-base rounded-lg bg-[#f5f0eb] border-[1.5px] border-[#d4c4b0] text-[#3a2e26] focus:outline-none focus:border-[#a6835e] resize-none placeholder:text-[#9c8a7d]"
          />

          <div className="flex justify-end mt-4">
            <button type="submit" className="px-6 py-2.5 text-base rounded-lg bg-[#7c5e3c] hover:bg-[#6b4f32] text-white font-medium transition-colors">
              加入灵感池
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
