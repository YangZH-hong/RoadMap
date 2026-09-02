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
    const { id, status }: { id: string; status: string } = body;

    await notion.pages.update({
      page_id: formatId(id),
      properties: { Status: { select: { name: status } } },
    });

    logger.info('api:versions', `状态更新 id=${id} status=${status}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('api:versions', `更新失败: ${error?.body?.message || error?.message}`);
    return NextResponse.json({ error: error?.body?.message || error?.message || '更新失败' }, { status: 500 });
  }
}
