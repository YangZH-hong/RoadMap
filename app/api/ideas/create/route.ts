import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content }: { content: string } = body;

    const ideasDbId = process.env.NOTION_IDEAS_DB_ID;
    if (!ideasDbId) {
      return NextResponse.json({ error: 'NOTION_IDEAS_DB_ID 未配置' }, { status: 500 });
    }

    const response: any = await notion.pages.create({
      parent: { database_id: ideasDbId },
      properties: {
        Idea: { title: [{ text: { content } }] },
        Status: { select: { name: 'Ideas' } },
        Category: { select: { name: 'Uncategorized' } },
      },
    });

    return NextResponse.json({ id: response.id });
  } catch (error: any) {
    console.error('创建灵感失败:', error);
    return NextResponse.json({ error: error.message || '创建失败' }, { status: 500 });
  }
}
