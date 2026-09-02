import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { logger } from '@/lib/logger';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

function formatId(id: string): string {
  if (!id || id.includes('-')) return id;
  const clean = id.replace(/[-_]/g, '');
  if (clean.length !== 32) return clean;
  return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id }: { id: string } = body;

    if (id.startsWith('temp-')) {
      logger.warn('api:ideas', `跳过删除临时 ID: ${id}`);
      return NextResponse.json({ success: true, skipped: true, reason: 'temporary id' });
    }

    await notion.pages.update({ page_id: formatId(id), archived: true });
    logger.info('api:ideas', `删除成功 id=${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('api:ideas', `删除失败: ${error?.body?.message || error?.message}`);
    return NextResponse.json({ error: error?.body?.message || error?.message || '删除失败' }, { status: 500 });
  }
}
