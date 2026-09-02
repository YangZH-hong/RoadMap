import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { logger } from '@/lib/logger';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, category, versionId }: {
      id: string;
      status: string;
      category: string;
      versionId?: string | null;
    } = body;

    const properties: Record<string, any> = {
      Status: { select: { name: status } },
      Category: { select: { name: category } },
    };

    if (versionId) {
      properties['Version'] = { relation: [{ id: versionId }] };
    } else {
      properties['Version'] = { relation: [] };
    }

    await notion.pages.update({ page_id: id, properties });
    logger.info('api:ideas', `更新成功 id=${id} status=${status}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('api:ideas', `更新失败: ${error?.body?.message || error?.message}`);
    return NextResponse.json({ error: error?.body?.message || error?.message || '更新失败' }, { status: 500 });
  }
}
