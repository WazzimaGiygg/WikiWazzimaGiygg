export type PageNamespace = 
  | 'Main' 
  | 'Talk' 
  | 'Special' 
  | 'Help' 
  | 'Manual' 
  | 'Template' 
  | 'Category' 
  | 'User';

export interface WikiPage {
  slug: string;
  title: string;
  namespace: PageNamespace;
  content: string; // Wikitext
  summary: string;
  author: string;
  authorId: string;
  revisionCount: number;
  latestRevisionId: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
}

export interface PageRevision {
  revId: string;
  pageId: string; // slug
  pageTitle: string;
  content: string; // Wikitext snapshot
  summary: string;
  timestamp: string;
  author: string;
  authorId: string;
  byteSize: number;
  minorEdit: boolean;
}

export interface RecentChange {
  id?: string;
  pageId: string;
  pageTitle: string;
  author: string;
  authorId: string;
  summary: string;
  timestamp: string;
  oldLen: number;
  newLen: number;
  revId: string;
  minorEdit: boolean;
}

export interface TalkComment {
  id: string;
  pageId: string;
  topicTitle: string;
  content: string;
  author: string;
  timestamp: string;
  parentId?: string;
}

export interface WikiUser {
  uid: string;
  username: string;
  isAnonymous: boolean;
  avatarUrl?: string;
  editCount: number;
  joinedAt: string;
}

export interface TOCItem {
  id: string;
  level: number;
  text: string;
  number: string;
}

export type WikiSkin = 'vector-modern' | 'vector-legacy' | 'dark-mode';

export interface WikiSettings {
  sitename: string;
  languageCode: string;
  allowAnonymousEditing: boolean;
  enableLivePreview: boolean;
  defaultSkin: WikiSkin;
  maxRecentChanges: number;
  repositoryUrl: string;
}
