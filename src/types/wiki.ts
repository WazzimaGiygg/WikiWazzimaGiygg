export type PageNamespace = 
  | 'Main' 
  | 'Talk' 
  | 'Special' 
  | 'Help' 
  | 'Manual' 
  | 'Template' 
  | 'Category' 
  | 'User'
  | 'Wiki';

export type PageProtectionLevel = 'unprotected' | 'semi_protected' | 'locked';

export interface PageProtectionLogEntry {
  id?: string;
  pageSlug: string;
  pageTitle: string;
  action: 'protect' | 'unprotect' | 'modify';
  previousLevel: PageProtectionLevel;
  newLevel: PageProtectionLevel;
  reason: string;
  expiry: string;
  performedBy: string;
  performedByUid: string;
  timestamp: string;
}

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
  protectionLevel?: PageProtectionLevel;
  protectionReason?: string;
  protectedBy?: string;
  protectedByUid?: string;
  protectedAt?: string;
  protectionExpiry?: string;
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

// 1. Verificação de Contas (CheckUser / Fantoches)
export type CheckUserStatus =
  | 'aberto'
  | 'investigando'
  | 'confirmado_fantoche'
  | 'inocente'
  | 'inconclusivo'
  | 'encerrado';

export interface CheckUserCase {
  id: string;
  title?: string;
  suspectedMaster: string;
  primarySuspect?: string;
  suspectedPuppets: string[];
  status: CheckUserStatus;
  evidence: string;
  reason?: string;
  requestedBy?: string;
  requestedByUid?: string;
  openedBy?: string;
  openedByUid?: string;
  verdict?: string;
  verdictNotes?: string;
  verifiedBy?: string;
  investigatedBy?: string;
  timestamp: string;
  updatedAt?: string;
}

// 2. Discussão de Desbloqueio (Unblock Request)
export type UnblockStatus =
  | 'pendente'
  | 'em_discussao'
  | 'aprovado'
  | 'recusado'
  | 'rejeitado'
  | 'encerrado';

export interface UnblockVote {
  user: string;
  userUid?: string;
  role?: string;
  vote: 'desbloquear' | 'manter_bloqueio' | 'neutro';
  comment: string;
  timestamp: string;
}

export interface UnblockRequest {
  id: string;
  username?: string;
  userName?: string;
  userUid?: string;
  blockedBy?: string;
  blockReason: string;
  appealReason: string;
  status: UnblockStatus;
  verdictNote?: string;
  reviewedBy?: string;
  votes: UnblockVote[];
  createdAt: string;
  updatedAt: string;
}

// 3. Conselho de Arbitragem (ArbCom)
export type ArbComStatus =
  | 'admissibilidade'
  | 'instrucao'
  | 'deliberacao'
  | 'aberto'
  | 'em_deliberacao'
  | 'decidido'
  | 'rejeitado'
  | 'arquivado'
  | 'encerrado';

export interface ArbComCase {
  id: string;
  caseNumber?: string;
  title: string;
  plaintiff: string;
  plaintiffUid?: string;
  respondent: string;
  status: ArbComStatus;
  summary?: string;
  description?: string;
  evidence?: string;
  arbitrators?: string[];
  decision?: string;
  finalDecision?: string;
  remedies?: string[];
  createdAt: string;
  updatedAt: string;
}

// 4. Código Universal de Conduta (UCoC)
export type UCoCCategory =
  | 'assedio'
  | 'assedio_perseguicao'
  | 'discriminacao'
  | 'discriminacao_odio'
  | 'abuso_de_poder'
  | 'guerra_de_edicoes'
  | 'incitacao_ao_odio'
  | 'vandalismo_psicologico'
  | 'doxxing'
  | 'outros';

export type UCoCStatus =
  | 'pendente'
  | 'sob_analise'
  | 'em_analise'
  | 'sancionado'
  | 'resolvido'
  | 'improcedente'
  | 'arquivado';

export interface UCoCReport {
  id: string;
  reportedUser: string;
  reporter?: string;
  reporterUser?: string;
  reporterUid?: string;
  category: UCoCCategory;
  description: string;
  evidence?: string;
  pageRelated?: string;
  status: UCoCStatus;
  resolution?: string;
  handledBy?: string;
  createdAt: string;
  updatedAt?: string;
}


