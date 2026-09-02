import { Client } from '@notionhq/client';
import { VersionItem, VersionStatus, IdeaItem, IdeaStatus } from '@/types/roadmap';
import { logger } from './logger';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

function formatId(id: string): string {
  if (!id || id.includes('-')) return id;
  const clean = id.replace(/[-_]/g, '');
  if (clean.length !== 32) return clean;
  return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
}

async function getAllIdeas(): Promise<IdeaItem[]> {
  const ideasDbId = formatId(process.env.NOTION_IDEAS_DB_ID || '');
  if (!ideasDbId) return [];

  try {
    const response: any = await notion.search({
      filter: { property: 'object', value: 'page' },
    });

    return (response.results || [])
      .map((page: any) => {
        const props = page.properties;
        if (!props.Idea) return null;
        return {
          id: page.id,
          content: props.Idea?.title?.[0]?.plain_text || '',
          status: (props.Status?.select?.name as IdeaStatus) || 'Ideas',
          category: props.Category?.select?.name || 'Uncategorized',
          versionId: props.Version?.relation?.[0]?.id || undefined,
        };
      })
      .filter(Boolean) as IdeaItem[];
  } catch (e) {
    logger.error('notion:ideas', `查询灵感表失败: ${e}`);
    return [];
  }
}

export async function getRoadmapVersion(): Promise<VersionItem[]> {
  const dataSourceId = formatId(process.env.NOTION_DATA_SOURCE_ID || '');
  if (!dataSourceId) return [];

  try {
    const response: any = await notion.dataSources.query({ data_source_id: dataSourceId });
    const versionPages = (response.results || []).filter(
      (p: any) => p.properties['Version']?.title?.[0]?.plain_text !== '灵感池'
    );

    const allIdeas = await getAllIdeas();
    const scheduledIdeas = allIdeas.filter((i: IdeaItem) => i.status === 'Scheduled');

    return versionPages.map((page: any) => {
      const props = page.properties;
      const version = props.Version?.title?.[0]?.plain_text || '0.0';
      const commit = props.Commit?.rich_text?.[0]?.plain_text || '';
      const status = (props.Status?.select?.name as VersionStatus) || 'Planned';

      const versionIdeas = scheduledIdeas.filter((i: IdeaItem) => i.versionId === page.id);

      const visibleRaw = props.VisibleCategories?.multi_select?.map((s: any) => s.name) || [];
      const ALL: Array<'scenarios'|'experience'|'foundation'|'performance'> = ['scenarios','experience','foundation','performance'];
      const visibleCategories = visibleRaw.length > 0
        ? ALL.filter((c) => visibleRaw.includes(c))
        : ALL;

      return {
        id: page.id,
        version,
        status,
        commit,
        visibleCategories,
        categories: {
          scenarios: versionIdeas.filter((i: IdeaItem) => i.category === 'scenarios'),
          experience: versionIdeas.filter((i: IdeaItem) => i.category === 'experience'),
          foundation: versionIdeas.filter((i: IdeaItem) => i.category === 'foundation'),
          performance: versionIdeas.filter((i: IdeaItem) => i.category === 'performance'),
        },
      };
    }).sort((a: VersionItem, b: VersionItem) => parseFloat(b.version) - parseFloat(a.version));
  } catch (e) {
    logger.error('notion:versions', `查询版本表失败: ${e}`);
    return [];
  }
}

export async function getIdeas(): Promise<IdeaItem[]> {
  return (await getAllIdeas()).filter((i: IdeaItem) => i.status === 'Ideas');
}

export async function getBacklog(): Promise<IdeaItem[]> {
  return (await getAllIdeas()).filter((i: IdeaItem) => i.status === 'Backlog');
}
