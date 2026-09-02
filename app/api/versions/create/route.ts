import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

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
    const { version, commit, visibleCategories }: { version: string; commit: string; visibleCategories?: string[] } = body;

    const databaseId = formatId(process.env.NOTION_DATABASE_ID || '');
    if (!databaseId) {
      return NextResponse.json({ error: 'NOTION_DATABASE_ID 未配置' }, { status: 500 });
    }

    const properties: Record<string, any> = {
      Version: { title: [{ text: { content: version } }] },
      Commit: { rich_text: [{ text: { content: commit || '' } }] },
      Status: { select: { name: 'Planned' } },
    };

    if (visibleCategories && visibleCategories.length > 0) {
      properties['VisibleCategories'] = {
        multi_select: visibleCategories.map((name: string) => ({ name })),
      };
    }

    const response: any = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    console.log('✅ 版本创建成功:', response.id);
    return NextResponse.json({ id: response.id, version, commit, status: 'Planned', visibleCategories });
  } catch (error: any) {
    console.error('❌ 创建版本失败:', error?.body?.message || error?.message);
    return NextResponse.json({ error: error?.body?.message || error?.message || '创建失败' }, { status: 500 });
  }
}
