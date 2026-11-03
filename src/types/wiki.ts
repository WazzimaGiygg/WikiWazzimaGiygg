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
  email?: string;
  isAnonymous: boolean;
  avatarUrl?: string;
  editCount: number;
  joinedAt: string;
  userPageSlug?: string;
  userTalkSlug?: string;
  userPageTitle?: string;
  userTalkTitle?: string;
  groups?: UserGroup[];
  isBureaucrat?: boolean;
  isAdmin?: boolean;
  isBlocked?: boolean;
}

export type UserGroup =
  | 'burocrata'
  | 'administrador'
  | 'eliminador'
  | 'reversor'
  | 'autorrevisor'
  | 'bot'
  | 'confirmado'
  | 'bloqueado';

export interface UserRightsRecord {
  uid: string;
  username: string;
  email?: string;
  groups: UserGroup[];
  updatedAt: string;
  updatedBy: string;
  updatedByUid: string;
}

export interface BureaucratLogEntry {
  id?: string;
  timestamp: string;
  bureaucratUid: string;
  bureaucratName: string;
  targetUid: string;
  targetName: string;
  addedGroups: UserGroup[];
  removedGroups: UserGroup[];
  reason: string;
  expiry: string;
}

export interface WikiExtensionInfo {
  id: string;
  name: string;
  category: 'parser' | 'media' | 'admin' | 'skin' | 'api';
  version: string;
  authors: string[];
  description: string;
  url: string;
  gitTag?: string;
  license: string;
  hooks: string[];
  exampleWikitext?: string;
  isActive: boolean;
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
