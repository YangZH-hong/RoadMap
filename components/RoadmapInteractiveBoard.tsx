'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { VersionItem, IdeaItem, CategoryKey, VersionStatus } from '@/types/roadmap';
import { logger } from '@/lib/logger';
import { StatusBadge } from './StatusBadge';
import { CreateIdeaModal } from './CreateIdeaModal';
import { CreateVersionModal } from './CreateVersionModal';

interface Props {
  initialVersions: VersionItem[];
  initialIdeas?: IdeaItem[];
  initialBacklog?: IdeaItem[];
}

const ALL_CATS: CategoryKey[] = ['scenarios', 'experience', 'foundation', 'performance'];

const CATEGORY_META: Record<CategoryKey, { label: string; color: string }> = {
  scenarios: { label: '应用场景', color: '#6b8fa3' },
  experience: { label: '用户体验', color: '#a6835e' },
  foundation: { label: '基座能力', color: '#8b6f8e' },
  performance: { label: '性能优化', color: '#6a9b7b' },
};

const STATUS_OPTIONS: VersionStatus[] = ['Planned', 'In Progress', 'Released'];

function DraggableCard({ item }: { item: IdeaItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-4 py-2.5 text-base border-[1.5px] rounded-lg cursor-grab active:cursor-grabbing select-none leading-relaxed transition-opacity duration-150 ${
        isDragging
          ? 'border-dashed border-[#d4c4b0] bg-[#faf5ef] opacity-40'
          : 'border-[#d4c4b0] bg-[#fffdf9] hover:border-[#a6835e] text-[#3a2e26]'
      }`}
    >
      {item.content}
    </div>
  );
}

function DroppableZone({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'ring-[1.5px] ring-[#a6835e] bg-[#faf5ef]' : ''}`}>
      {children}
    </div>
  );
}

function PreviewCard({ content }: { content: string }) {
  return (
    <div className="px-5 py-3 text-base border-[1.5px] border-[#a6835e] rounded-lg bg-[#fffdf9] text-[#3a2e26] shadow-xl max-w-[320px] leading-relaxed">
      {content}
    </div>
  );
}

function TrashOverlay({ isActive }: { isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash' });
  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-8 right-8 z-40 transition-all duration-200 ${
        isActive ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
      }`}
    >
      <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
        isOver && isActive
          ? 'border-[#c0392b] bg-[#c0392b] bg-opacity-10 scale-110'
          : 'border-dashed border-[#c0392b] bg-[#fdf0ef]'
      }`}>
        <span className="text-2xl">{isOver && isActive ? '🗑' : '🗑'}</span>
        <span className={`text-xs mt-0.5 font-medium ${isOver && isActive ? 'text-white' : 'text-[#c0392b]'}`}>删除</span>
      </div>
    </div>
  );
}

function VersionMenu({ version, onUpdate, onDelete }: {
  version: VersionItem;
  onUpdate: (id: string, status: VersionStatus) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9c8a7d] hover:text-[#3a2e26] hover:bg-[#f5f0eb] cursor-pointer text-lg leading-none"
      >
        ···
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-[#fffdf9] border-2 border-[#8b6f5e] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e8ddd2]">
              <span className="text-xs font-medium text-[#6b5b50]">状态</span>
            </div>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => { onUpdate(version.id, s); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer hover:bg-[#f5f0eb] ${
                  version.status === s ? 'bg-[#f5f0eb] font-medium text-[#3a2e26]' : 'text-[#6b5b50]'
                }`}
              >
                {s === 'Planned' ? '计划中' : s === 'In Progress' ? '进行中' : '已发布'}
              </button>
            ))}
            <div className="border-t border-[#e8ddd2]" />
            <button
              onClick={() => { if (confirm('确定删除此版本？')); onDelete(version.id); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#c0392b] hover:bg-[#fdf0ef] cursor-pointer"
            >
              删除版本
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function findItemSource(id: string, ideas: IdeaItem[], backlog: IdeaItem[], versions: VersionItem[]) {
  const idx = ideas.findIndex(i => i.id === id);
  if (idx >= 0) return { list: 'ideas' as const, item: ideas[idx] };
  const bIdx = backlog.findIndex(i => i.id === id);
  if (bIdx >= 0) return { list: 'backlog' as const, item: backlog[bIdx] };
  for (const v of versions) {
    for (const [key, cat] of Object.entries(v.categories) as [CategoryKey, IdeaItem[]][]) {
      const cIdx = cat.findIndex(i => i.id === id);
      if (cIdx >= 0) return { list: 'version' as const, item: cat[cIdx], versionId: v.id, catKey: key };
    }
  }
  return null;
}

async function syncIdeaToNotion(id: string, status: string, category: string, versionPageId?: string | null): Promise<void> {
  try {
    const res = await fetch('/api/ideas/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, category, versionId: versionPageId }),
    });
    if (!res.ok) {
      const data = await res.json();
      logger.warn('board:sync', `同步失败 id=${id}: ${data.error || res.status}`);
    }
  } catch (e) {
    logger.warn('board:sync', `请求异常 id=${id}: ${e}`);
  }
}

async function deleteIdeaFromNotion(id: string): Promise<void> {
  try {
    if (id.startsWith('temp-')) {
      logger.warn('board:trash', `跳过删除临时灵感 id=${id}`);
      return;
    }
    const res = await fetch('/api/ideas/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      logger.warn('board:trash', `删除失败 id=${id}: ${data.error || res.status}`);
    }
  } catch (e) {
    logger.warn('board:trash', `请求异常 id=${id}: ${e}`);
  }
}

export function RoadmapInteractiveBoard({ initialVersions, initialIdeas, initialBacklog }: Props) {
  const [mounted, setMounted] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>(initialVersions);
  const [ideas, setIdeas] = useState<IdeaItem[]>(initialIdeas ?? []);
  const [backlog, setBacklog] = useState<IdeaItem[]>(initialBacklog ?? []);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => { setMounted(true); }, []);

  const activeItem = activeId ? findItemSource(activeId, ideas, backlog, versions)?.item ?? null : null;

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    if (activeIdStr === overIdStr) return;

    const source = findItemSource(activeIdStr, ideas, backlog, versions);
    if (!source) return;
    const item = source.item;

    const isIdeasZone = overIdStr === 'ideas';
    const isBacklogZone = overIdStr === 'backlog';
    const isTrash = overIdStr === 'trash';
    const isCategoryZone = overIdStr.includes('__');

    // Remove from source
    if (source.list === 'ideas') {
      setIdeas(prev => prev.filter(i => i.id !== activeIdStr));
    } else if (source.list === 'backlog') {
      setBacklog(prev => prev.filter(i => i.id !== activeIdStr));
    } else if (source.list === 'version') {
      setVersions(prev => prev.map(v => {
        const newCats = { ...v.categories };
        for (const [key, cat] of Object.entries(newCats) as [CategoryKey, IdeaItem[]][]) {
          const idx = cat.findIndex(i => i.id === activeIdStr);
          if (idx >= 0) {
            newCats[key] = cat.filter(i => i.id !== activeIdStr);
            break;
          }
        }
        return { ...v, categories: newCats };
      }));
    }

    // Add to target
    if (isTrash) {
      deleteIdeaFromNotion(item.id);
      return;
    }

    if (isIdeasZone) {
      setIdeas(prev => [...prev, { ...item, status: 'Ideas', category: 'Uncategorized', versionId: undefined }]);
      syncIdeaToNotion(item.id, 'Ideas', 'Uncategorized', null);
    } else if (isBacklogZone) {
      setBacklog(prev => [...prev, { ...item, status: 'Backlog', category: 'Uncategorized', versionId: undefined }]);
      syncIdeaToNotion(item.id, 'Backlog', 'Uncategorized', null);
    } else if (isCategoryZone) {
      const [versionId, catKey] = overIdStr.split('__');
      const category = catKey as CategoryKey;
      setVersions(prev => prev.map(v => {
        if (v.id === versionId) {
          const list = v.categories[category] || [];
          if (list.find(i => i.id === item.id)) return v;
          return { ...v, categories: { ...v.categories, [category]: [...list, { ...item, category, versionId: v.id }] } };
        }
        return v;
      }));
      syncIdeaToNotion(item.id, 'Scheduled', category, versionId);
    }
  };

  const handleCreateVersion = async (version: string, commit: string, visibleCats: CategoryKey[]) => {
    try {
      const res = await fetch('/api/versions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, commit, visibleCategories: visibleCats }),
      });
      if (!res.ok) {
        const errData = await res.json();
        logger.error('board:create-version', `API错误: ${errData.error}`);
        alert('创建失败: ' + (errData.error || '未知错误'));
        return;
      }
      const data = await res.json();

      const emptyCats: Record<string, IdeaItem[]> = {};
      ALL_CATS.forEach(k => emptyCats[k] = []);

      const newVersion: VersionItem = {
        id: data.id,
        version: data.version,
        commit: data.commit,
        status: 'Planned',
        categories: emptyCats as any,
        visibleCategories: visibleCats,
      };

      setVersions(prev => [newVersion, ...prev]);
    } catch (e) {
      logger.error('board:create-version', `异常: ${e}`);
    }
  };

  const handleUpdateVersionStatus = async (id: string, status: VersionStatus) => {
    setVersions(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    try {
      await fetch('/api/versions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      console.error('更新状态失败:', e);
    }
  };

  const handleDeleteVersion = async (id: string) => {
    setVersions(prev => prev.filter(v => v.id !== id));
    try {
      await fetch('/api/versions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.error('删除版本失败:', e);
    }
  };

  if (!mounted) return null;

  const CAT_BOX_MIN_H = 130;

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[#f5f0eb]">
        {/* 标题 */}
        <header className="text-center pt-5 pb-6">
          <img src="/roadmap-title.png?v=2" alt="RoadMap" className="mx-auto w-[800px]" />
        </header>

        {/* 三栏布局 */}
        <div className="flex flex-col xl:flex-row gap-6 px-6 pb-10">
          {/* 灵感池 */}
          <aside className="w-full xl:w-64 flex-shrink-0">
            <div className="sticky top-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-[2px] border-[#8b6f5e]">
                <h2 className="text-base font-medium text-[#3a2e26] tracking-wide">灵感池</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#9c8a7d]">{ideas.length}</span>
                  <button
                    onClick={() => setIsIdeaModalOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium border border-[#8b6f5e] rounded-lg bg-[#fffdf9] text-[#3a2e26] hover:bg-[#faf5ef] cursor-pointer"
                  >
                    + 新灵感
                  </button>
                </div>
              </div>
              <DroppableZone id="ideas" className="space-y-2.5 min-h-[200px]">
                {ideas.map(item => <DraggableCard key={item.id} item={item} />)}
                {ideas.length === 0 && <div className="text-center py-8 text-sm text-[#9c8a7d]">暂无灵感</div>}
              </DroppableZone>
            </div>
          </aside>

          {/* 版本时间线 */}
          <section className="flex-1 min-w-0 relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-[#d4c4b0]" />

            <div className="space-y-12 pl-8">
              {/* 创建版本按钮 */}
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#8b6f5e] border border-dashed border-[#8b6f5e] rounded-xl hover:bg-[#faf5ef] cursor-pointer"
              >
                + 新建版本
              </button>

              {versions.map(item => {
                const visibleCats = item.visibleCategories || ALL_CATS;
                return (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[28px] top-8 w-[10px] h-[10px] rounded-full border-[2px] border-[#8b6f5e] bg-[#f5f0eb]" />
                    <div className="rounded-xl border-[2px] border-[#d4c4b0] bg-[#fffdf9] overflow-hidden">
                      <div className="px-7 py-5 border-b-[2px] border-[#e8ddd2]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold tracking-wide text-[#3a2e26]">v{item.version}</span>
                            {item.commit && <span className="text-base text-[#6b5b50]">{item.commit}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={item.status} />
                            <VersionMenu
                              version={item}
                              onUpdate={handleUpdateVersionStatus}
                              onDelete={handleDeleteVersion}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 网格 - 根据板块数量自适应 */}
                      <div className="p-5 grid gap-4" style={{
                        gridTemplateColumns: visibleCats.length <= 1 ? '1fr' : visibleCats.length === 2 ? '1fr 1fr' : '1fr 1fr'
                      }}>
                        {visibleCats.map(catKey => {
                          const config = CATEGORY_META[catKey];
                          const list = item.categories[catKey] || [];
                          const droppableId = `${item.id}__${catKey}`;
                          const isEmpty = list.length === 0;

                          return (
                            <div
                              key={droppableId}
                              className={`rounded-lg border-[1.5px] p-5 flex flex-col ${
                                isEmpty ? 'border-dashed border-[#d4c4b0]' : 'border-[#e8ddd2]'
                              }`}
                              style={{ minHeight: `${CAT_BOX_MIN_H}px` }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className={`text-sm font-medium tracking-wide ${isEmpty ? 'transition-opacity duration-200' : ''}`}
                                  style={{ color: config.color, ...(isEmpty ? { opacity: activeId ? 1 : 0 } : {}) }}
                                >
                                  {config.label}
                                </span>
                                <span className={`text-sm text-[#9c8a7d] ${isEmpty && !activeId ? 'opacity-0' : ''}`}>
                                  {list.length}
                                </span>
                              </div>
                              <DroppableZone id={droppableId} className="flex-1 space-y-2.5">
                                {list.map(i => <DraggableCard key={i.id} item={i} />)}
                                {isEmpty && (
                                  <div className={`flex items-center justify-center w-full h-full transition-opacity duration-200 ${activeId ? 'opacity-60' : 'opacity-0'}`} style={{ minHeight: '60px' }}>
                                    <span className="text-xs text-[#9c8a7d]">放这里</span>
                                  </div>
                                )}
                              </DroppableZone>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {versions.length === 0 && <div className="text-center py-16 text-[#9c8a7d] text-base">暂无版本数据</div>}
            </div>
          </section>

          {/* 储备库 */}
          <aside className="w-full xl:w-64 flex-shrink-0">
            <div className="sticky top-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-[2px] border-[#8b6f5e]">
                <h2 className="text-base font-medium text-[#3a2e26] tracking-wide">储备库</h2>
                <span className="text-sm text-[#9c8a7d]">{backlog.length}</span>
              </div>
              <DroppableZone id="backlog" className="space-y-2.5 min-h-[200px]">
                {backlog.map(item => <DraggableCard key={item.id} item={item} />)}
                {backlog.length === 0 && <div className="text-center py-8 text-sm text-[#9c8a7d]">暂缓排期</div>}
              </DroppableZone>
            </div>
          </aside>
        </div>

        {/* 垃圾桶 - 固定右下角 */}
        <TrashOverlay isActive={activeId !== null} />

        <DragOverlay>{activeItem ? <PreviewCard content={activeItem.content} /> : null}</DragOverlay>
      </div>
    </DndContext>

    <CreateIdeaModal isOpen={isIdeaModalOpen} onClose={() => setIsIdeaModalOpen(false)} onAdd={async (idea) => {
      try {
        const res = await fetch('/api/ideas/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: idea.content }),
        });
        if (!res.ok) throw new Error('创建失败');
        const data = await res.json();
        setIdeas(prev => [...prev, { ...idea, id: data.id }]);
      } catch {
        setIdeas(prev => [...prev, { ...idea, id: `temp-${Date.now()}` }]);
      }
    }} />

    <CreateVersionModal
      isOpen={isVersionModalOpen}
      onClose={() => setIsVersionModalOpen(false)}
      onCreate={handleCreateVersion}
    />
  </>
);
}
