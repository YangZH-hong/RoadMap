import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

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

    // Version 是 Relation 类型
    if (versionId) {
      properties['Version'] = { relation: [{ id: versionId }] };
    } else {
      properties['Version'] = { relation: [] };
    }

    await notion.pages.update({ page_id: id, properties });
    console.log('✅ 灵感更新成功:', { id, status, category, versionId });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const errorMsg = error?.body?.message || error?.message || '更新失败';
    console.error('❌ 更新失败:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
