export type VersionStatus = 'Planned' | 'In Progress' | 'Released';
export type IdeaStatus = 'Ideas' | 'Backlog' | 'Scheduled';
export type CategoryKey = 'scenarios' | 'experience' | 'foundation' | 'performance';

export interface IdeaItem {
  id: string;
  content: string;
  status: IdeaStatus;
  category: string;
  versionId?: string;
}

export interface VersionCategories {
  scenarios: IdeaItem[];
  experience: IdeaItem[];
  foundation: IdeaItem[];
  performance: IdeaItem[];
}

export interface VersionItem {
  id: string;
  version: string;
  commit: string;
  status: VersionStatus;
  categories: VersionCategories;
  visibleCategories?: CategoryKey[];
}
