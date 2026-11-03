import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  WikiPage,
  PageRevision,
  RecentChange,
  PageNamespace,
  TalkComment,
  WikiSettings,
  UserGroup,
  UserRightsRecord,
  BureaucratLogEntry,
  WikiUser,
  PageProtectionLevel,
  PageProtectionLogEntry,
} from '../types/wiki';
import { INITIAL_PAGES } from '../core/defaultPages';
import { slugify } from '../core/parser';

const WIKI_PAGES_COLLECTION = 'wiki_pages';
const RECENT_CHANGES_COLLECTION = 'recent_changes';
const WIKI_SETTINGS_COLLECTION = 'wiki_settings';
const USER_ROLES_COLLECTION = 'user_roles';
const BUREAUCRAT_LOGS_COLLECTION = 'bureaucrat_logs';
const PAGE_PROTECTION_LOGS_COLLECTION = 'page_protection_logs';
export const DEFAULT_SUPER_ADMIN_EMAIL = 'pedrohenriquecardonaperes@gmail.com';

let isSeeding = false;

// Ensure initial pages exist in Firestore if database is fresh
export async function seedInitialPagesIfNeeded(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const mainDocRef = doc(db, WIKI_PAGES_COLLECTION, 'Página_principal');
    const snap = await getDoc(mainDocRef);

    if (!snap.exists()) {
      console.log('Seeding initial WikiWazzimaGiygg articles into Firestore...');
      for (const [slug, page] of Object.entries(INITIAL_PAGES)) {
        await setDoc(doc(db, WIKI_PAGES_COLLECTION, slug), page);

        const revRef = doc(db, `${WIKI_PAGES_COLLECTION}/${slug}/revisions`, page.latestRevisionId);
        await setDoc(revRef, {
          revId: page.latestRevisionId,
          pageId: slug,
          pageTitle: page.title,
          content: page.content,
          summary: page.summary,
          timestamp: page.createdAt,
          author: page.author,
          authorId: page.authorId,
          byteSize: new Blob([page.content]).size,
          minorEdit: false,
        });

        await addDoc(collection(db, RECENT_CHANGES_COLLECTION), {
          pageId: slug,
          pageTitle: page.title,
          author: page.author,
          authorId: page.authorId,
          summary: page.summary,
          timestamp: page.updatedAt,
          oldLen: 0,
          newLen: new Blob([page.content]).size,
          revId: page.latestRevisionId,
          minorEdit: false,
        });
      }
    } else {
      // If Página_principal already exists in Firestore but lacks protectionLevel, initialize it
      const existingData = snap.data();
      if (!existingData.protectionLevel) {
        await setDoc(
          mainDocRef,
          {
            protectionLevel: 'locked',
            isLocked: true,
            protectionReason: 'Página inicial protegida por alta visibilidade e integridade do portal',
            protectedBy: 'Administração',
            protectedByUid: 'system_admin',
            protectedAt: '2026-11-01T00:00:00.000Z',
            protectionExpiry: 'infinity',
          },
          { merge: true }
        );
      }
    }
  } catch (error) {
    console.warn('Could not seed initial pages to Firestore:', error);
  } finally {
    isSeeding = false;
  }
}

// 1. REAL-TIME PAGE SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToPage(
  rawSlug: string,
  callback: (page: WikiPage | null) => void
): Unsubscribe {
  const slug = slugify(rawSlug);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}`;
  const pageRef = doc(db, WIKI_PAGES_COLLECTION, slug);

  return onSnapshot(
    pageRef,
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as WikiPage);
      } else {
        // Only return data if it actually exists in Firestore
        callback(null);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for page ${slug}:`, error);
      callback(null);
    }
  );
}

// 2. REAL-TIME ALL PAGES SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToAllPages(
  callback: (pages: WikiPage[]) => void
): Unsubscribe {
  const path = WIKI_PAGES_COLLECTION;
  const colRef = collection(db, WIKI_PAGES_COLLECTION);

  return onSnapshot(
    colRef,
    snapshot => {
      const pages: WikiPage[] = [];
      snapshot.docs.forEach(docSnap => {
        pages.push(docSnap.data() as WikiPage);
      });
      pages.sort((a, b) => a.title.localeCompare(b.title));
      callback(pages);
    },
    error => {
      console.warn('Firestore onSnapshot error for all pages:', error);
      callback([]);
    }
  );
}

// 3. REAL-TIME REVISIONS SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToPageRevisions(
  rawSlug: string,
  callback: (revisions: PageRevision[]) => void
): Unsubscribe {
  const slug = slugify(rawSlug);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}/revisions`;
  const revCol = collection(db, `${WIKI_PAGES_COLLECTION}/${slug}/revisions`);
  const q = query(revCol, orderBy('timestamp', 'desc'), limit(50));

  return onSnapshot(
    q,
    snapshot => {
      if (!snapshot.empty) {
        callback(snapshot.docs.map(d => d.data() as PageRevision));
      } else {
        callback([]);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for revisions of ${slug}:`, error);
      callback([]);
    }
  );
}

// 4. REAL-TIME RECENT CHANGES SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToRecentChanges(
  callback: (changes: RecentChange[]) => void,
  maxCount = 50
): Unsubscribe {
  const path = RECENT_CHANGES_COLLECTION;
  const rcCol = collection(db, RECENT_CHANGES_COLLECTION);
  const q = query(rcCol, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    snapshot => {
      if (!snapshot.empty) {
        const changes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RecentChange));
        callback(changes);
      } else {
        callback([]);
      }
    },
    error => {
      console.warn('Firestore onSnapshot error for recent changes:', error);
      callback([]);
    }
  );
}

// 5. REAL-TIME TALK TOPICS SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToPageTalks(
  rawSlug: string,
  callback: (talks: TalkComment[]) => void
): Unsubscribe {
  const slug = slugify(rawSlug);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}/talks`;
  const talkCol = collection(db, `${WIKI_PAGES_COLLECTION}/${slug}/talks`);
  const q = query(talkCol, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    snapshot => {
      if (!snapshot.empty) {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TalkComment)));
      } else {
        callback([]);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for talks of ${slug}:`, error);
      callback([]);
    }
  );
}

export async function addTalkComment(params: {
  pageId: string;
  topicTitle: string;
  content: string;
  author: string;
  authorId: string;
}): Promise<void> {
  const slug = slugify(params.pageId);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}/talks`;
  const commentData = {
    pageId: slug,
    topicTitle: params.topicTitle,
    content: params.content,
    author: params.author,
    authorId: params.authorId,
    timestamp: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, `${WIKI_PAGES_COLLECTION}/${slug}/talks`), commentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// 6. REAL-TIME SETTINGS SUBSCRIPTION - STRICTLY FROM FIRESTORE
export function subscribeToWikiSettings(
  callback: (settings: WikiSettings) => void
): Unsubscribe {
  const path = `${WIKI_SETTINGS_COLLECTION}/global`;
  const docRef = doc(db, WIKI_SETTINGS_COLLECTION, 'global');

  return onSnapshot(
    docRef,
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as WikiSettings);
      }
    },
    error => {
      console.warn('Firestore onSnapshot error for settings:', error);
    }
  );
}

export async function saveWikiSettingsToFirestore(settings: WikiSettings): Promise<void> {
  const path = `${WIKI_SETTINGS_COLLECTION}/global`;
  try {
    await setDoc(doc(db, WIKI_SETTINGS_COLLECTION, 'global'), {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// One-shot functions strictly querying Firestore
export async function getPage(rawSlug: string): Promise<WikiPage | null> {
  const slug = slugify(rawSlug);
  try {
    const pageRef = doc(db, WIKI_PAGES_COLLECTION, slug);
    const snap = await getDoc(pageRef);

    if (snap.exists()) {
      return snap.data() as WikiPage;
    }
  } catch (error) {
    console.warn(`Firestore getPage error for ${slug}:`, error);
  }

  // Strictly return null if not in Firestore
  return null;
}

export async function savePage(params: {
  slug: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  authorId: string;
  minorEdit?: boolean;
  namespace?: PageNamespace;
  user?: WikiUser;
}): Promise<WikiPage> {
  const slug = slugify(params.slug);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}`;
  const now = new Date().toISOString();
  const byteSize = new Blob([params.content]).size;
  const revId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let namespace: PageNamespace = params.namespace || 'Main';
  if (params.title.startsWith('Ajuda:') || params.title.startsWith('Help:')) namespace = 'Help';
  else if (params.title.startsWith('Discussão:') || params.title.startsWith('Talk:') || params.title.startsWith('Discussão_Usuário:')) namespace = 'Talk';
  else if (params.title.startsWith('Especial:') || params.title.startsWith('Special:')) namespace = 'Special';
  else if (params.title.startsWith('Manual:')) namespace = 'Manual';
  else if (params.title.startsWith('Predefinição:') || params.title.startsWith('Template:')) namespace = 'Template';
  else if (params.title.startsWith('Categoria:') || params.title.startsWith('Category:')) namespace = 'Category';
  else if (params.title.startsWith('Usuário:') || params.title.startsWith('User:')) namespace = 'User';

  const categoryMatches = params.content.matchAll(/\[\[(?:Categoria|Category):([^\]]+)\]\]/gi);
  const categories: string[] = [];
  for (const match of categoryMatches) {
    categories.push(match[1].trim());
  }

  let existingPage: WikiPage | null = null;
  let oldLen = 0;
  try {
    const existingSnap = await getDoc(doc(db, WIKI_PAGES_COLLECTION, slug));
    if (existingSnap.exists()) {
      existingPage = existingSnap.data() as WikiPage;
      oldLen = new Blob([existingPage.content]).size;
    }
  } catch {
    // If not found in Firestore, existingPage is null
  }

  // ENFORCE PROTECTION RULES DURING EDIT OPERATIONS
  if (existingPage && params.user) {
    const check = canUserEditPage(existingPage, params.user);
    if (!check.allowed) {
      throw new Error(`Edição bloqueada: ${check.reason}`);
    }
  }

  // Preserve existing protection metadata so regular edits never wipe out protection status
  const protectionLevel = existingPage?.protectionLevel || (existingPage?.isLocked ? 'locked' : 'unprotected');
  const isLocked = existingPage?.isLocked ?? (protectionLevel === 'locked');
  const protectionReason = existingPage?.protectionReason;
  const protectedBy = existingPage?.protectedBy;
  const protectedByUid = existingPage?.protectedByUid;
  const protectedAt = existingPage?.protectedAt;
  const protectionExpiry = existingPage?.protectionExpiry;

  const updatedPage: WikiPage = {
    slug,
    title: params.title,
    namespace,
    content: params.content,
    summary: params.summary || (existingPage ? 'Edição de conteúdo' : 'Criação de nova página'),
    author: params.author,
    authorId: params.authorId,
    revisionCount: (existingPage?.revisionCount || 0) + 1,
    latestRevisionId: revId,
    categories,
    createdAt: existingPage?.createdAt || now,
    updatedAt: now,
    isLocked,
    protectionLevel,
    ...(protectionReason ? { protectionReason } : {}),
    ...(protectedBy ? { protectedBy } : {}),
    ...(protectedByUid ? { protectedByUid } : {}),
    ...(protectedAt ? { protectedAt } : {}),
    ...(protectionExpiry ? { protectionExpiry } : {}),
  };

  const newRevision: PageRevision = {
    revId,
    pageId: slug,
    pageTitle: params.title,
    content: params.content,
    summary: updatedPage.summary,
    timestamp: now,
    author: params.author,
    authorId: params.authorId,
    byteSize,
    minorEdit: !!params.minorEdit,
  };

  const recentChange: RecentChange = {
    pageId: slug,
    pageTitle: params.title,
    author: params.author,
    authorId: params.authorId,
    summary: updatedPage.summary,
    timestamp: now,
    oldLen,
    newLen: byteSize,
    revId,
    minorEdit: !!params.minorEdit,
  };

  try {
    await setDoc(doc(db, WIKI_PAGES_COLLECTION, slug), updatedPage);
    await setDoc(doc(db, `${WIKI_PAGES_COLLECTION}/${slug}/revisions`, revId), newRevision);
    await addDoc(collection(db, RECENT_CHANGES_COLLECTION), recentChange);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  return updatedPage;
}

export async function getPageRevisions(rawSlug: string): Promise<PageRevision[]> {
  const slug = slugify(rawSlug);
  try {
    const revCol = collection(db, `${WIKI_PAGES_COLLECTION}/${slug}/revisions`);
    const q = query(revCol, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map(d => d.data() as PageRevision);
    }
  } catch (error) {
    console.warn(`Could not get revisions from Firestore for ${slug}:`, error);
  }

  return [];
}

export async function getRecentChangesList(maxCount = 50): Promise<RecentChange[]> {
  try {
    const rcCol = collection(db, RECENT_CHANGES_COLLECTION);
    const q = query(rcCol, orderBy('timestamp', 'desc'), limit(maxCount));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecentChange));
    }
  } catch (error) {
    console.warn('Could not fetch recent changes from Firestore:', error);
  }

  return [];
}

export async function getAllPagesList(namespaceFilter?: PageNamespace): Promise<WikiPage[]> {
  const pages: WikiPage[] = [];

  try {
    const snap = await getDocs(collection(db, WIKI_PAGES_COLLECTION));
    snap.forEach(d => {
      const page = d.data() as WikiPage;
      if (!namespaceFilter || page.namespace === namespaceFilter) {
        pages.push(page);
      }
    });
  } catch (error) {
    console.warn('Could not fetch all pages from Firestore:', error);
  }

  return pages.sort((a, b) => a.title.localeCompare(b.title));
}

export async function searchWikiPages(searchQuery: string): Promise<WikiPage[]> {
  const trimmed = searchQuery.trim().toLowerCase();
  if (!trimmed) return [];

  const allPages = await getAllPagesList();
  return allPages.filter(page => {
    return (
      page.title.toLowerCase().includes(trimmed) ||
      page.content.toLowerCase().includes(trimmed) ||
      page.slug.toLowerCase().includes(trimmed) ||
      page.categories.some(c => c.toLowerCase().includes(trimmed))
    );
  });
}

export interface UserPagesResult {
  userPageSlug: string;
  userTalkSlug: string;
  userPageTitle: string;
  userTalkTitle: string;
  isDisambiguated: boolean;
  createdPages: string[];
}

/**
 * Creates initial user page (Usuário:<Nome>) and user talk page (Discussão_Usuário:<Nome>)
 * automatically in Firestore upon first login.
 * If another user already exists with the same name, disambiguates by appending Google UID
 * (Usuário:<Nome> (<UID>)) to ensure pages are never shared or overwritten between users.
 */
export async function ensureUserPagesExist(user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}): Promise<UserPagesResult> {
  const baseName = (user.displayName || user.email?.split('@')[0] || 'Usuário').trim();
  const createdPages: string[] = [];

  const disambiguatedTitle = `Usuário:${baseName} (${user.uid})`;
  const disambiguatedTalkTitle = `Discussão_Usuário:${baseName} (${user.uid})`;
  const standardTitle = `Usuário:${baseName}`;
  const standardTalkTitle = `Discussão_Usuário:${baseName}`;

  // 1. Check if user already has an existing disambiguated page they own
  const userDisambiguatedPage = await getPage(disambiguatedTitle);
  if (userDisambiguatedPage && userDisambiguatedPage.authorId === user.uid) {
    const existingTalk = await getPage(disambiguatedTalkTitle);
    if (!existingTalk) {
      await createInitialUserTalkPage(disambiguatedTalkTitle, baseName, user.uid);
      createdPages.push(disambiguatedTalkTitle);
    }
    return {
      userPageSlug: slugify(disambiguatedTitle),
      userTalkSlug: slugify(disambiguatedTalkTitle),
      userPageTitle: disambiguatedTitle,
      userTalkTitle: disambiguatedTalkTitle,
      isDisambiguated: true,
      createdPages,
    };
  }

  // 2. Check if standard page exists
  const standardPage = await getPage(standardTitle);
  if (standardPage) {
    if (standardPage.authorId === user.uid) {
      // The standard page is already owned by this exact user
      const existingTalk = await getPage(standardTalkTitle);
      if (!existingTalk) {
        await createInitialUserTalkPage(standardTalkTitle, baseName, user.uid);
        createdPages.push(standardTalkTitle);
      }
      return {
        userPageSlug: slugify(standardTitle),
        userTalkSlug: slugify(standardTalkTitle),
        userPageTitle: standardTitle,
        userTalkTitle: standardTalkTitle,
        isDisambiguated: false,
        createdPages,
      };
    } else {
      // Collision detected! Another user already owns the standard title.
      // Append the Google UID to the created page name:
      const targetTitle = disambiguatedTitle;
      const targetTalkTitle = disambiguatedTalkTitle;

      const existingTarget = await getPage(targetTitle);
      if (!existingTarget) {
        await createInitialUserPage(targetTitle, baseName, user.uid, true);
        createdPages.push(targetTitle);
      }
      const existingTargetTalk = await getPage(targetTalkTitle);
      if (!existingTargetTalk) {
        await createInitialUserTalkPage(targetTalkTitle, baseName, user.uid);
        createdPages.push(targetTalkTitle);
      }
      return {
        userPageSlug: slugify(targetTitle),
        userTalkSlug: slugify(targetTalkTitle),
        userPageTitle: targetTitle,
        userTalkTitle: targetTalkTitle,
        isDisambiguated: true,
        createdPages,
      };
    }
  }

  // 3. Standard page doesn't exist yet. Check if another user with the same name exists anywhere in the wiki
  const allPages = await getAllPagesList();
  const anotherUserWithSameName = allPages.some(
    p =>
      p.author?.trim().toLowerCase() === baseName.toLowerCase() &&
      p.authorId &&
      p.authorId !== user.uid
  );

  let finalTitle = standardTitle;
  let finalTalkTitle = standardTalkTitle;
  let isDisambiguated = false;

  if (anotherUserWithSameName) {
    // Collision detected with another editor sharing the same name
    finalTitle = disambiguatedTitle;
    finalTalkTitle = disambiguatedTalkTitle;
    isDisambiguated = true;
  }

  // Create user page if needed
  const existingUserPage = await getPage(finalTitle);
  if (!existingUserPage) {
    await createInitialUserPage(finalTitle, baseName, user.uid, isDisambiguated);
    createdPages.push(finalTitle);
  }

  // Create user talk page if needed
  const existingTalkPage = await getPage(finalTalkTitle);
  if (!existingTalkPage) {
    await createInitialUserTalkPage(finalTalkTitle, baseName, user.uid);
    createdPages.push(finalTalkTitle);
  }

  return {
    userPageSlug: slugify(finalTitle),
    userTalkSlug: slugify(finalTalkTitle),
    userPageTitle: finalTitle,
    userTalkTitle: finalTalkTitle,
    isDisambiguated,
    createdPages,
  };
}

async function createInitialUserPage(
  title: string,
  userName: string,
  uid: string,
  hasDisambiguation: boolean
): Promise<WikiPage> {
  const content = `== Página de Usuário: ${userName} ==

{| class="wikitable" style="width: 100%; max-width: 520px;"
! Campo !! Detalhe
|-
| '''Usuário''' || ${userName}
|-
| '''Google UID''' || <code>${uid}</code>
|-
| '''Status''' || Colaborador Registrado
|-
| '''Registro''' || Página criada automaticamente no primeiro acesso
|}

=== Perfil do Usuário ===
Esta é a página pessoal de '''${userName}''' no '''WikiWazzimaGiygg'''. Aqui ficam registrados o perfil de contribuição, tópicos de interesse e atalhos úteis.

${
  hasDisambiguation
    ? `{{Aviso|'''Nota de Desambiguação de Nome:''' Como já existe outro usuário registrado com o nome "${userName}" na wiki, seu Google UID (<code>${uid}</code>) foi adicionado ao título da página para garantir que sua página seja individual e nunca compartilhada por duas pessoas.}}`
    : ''
}

=== Navegação e Recursos ===
* [[Especial:Mudanças_recentes|Acompanhar mudanças recentes da wiki]]
* [[Ajuda:Wikitexto|Consultar o guia de sintaxe wikitexto]]
* [[Especial:Todas_as_páginas|Explorar todas as páginas da WikiWazzimaGiygg]]

[[Categoria:Usuários]]`;

  return savePage({
    slug: slugify(title),
    title,
    content,
    summary: hasDisambiguation
      ? 'Criação automática de página de usuário no primeiro acesso (desambiguação de UID)'
      : 'Criação automática de página de usuário no primeiro acesso',
    author: userName,
    authorId: uid,
    namespace: 'User',
  });
}

async function createInitialUserTalkPage(
  title: string,
  userName: string,
  uid: string
): Promise<WikiPage> {
  const content = `== Discussão de Usuário: ${userName} ==

Esta é a página de discussão de '''${userName}''' no '''WikiWazzimaGiygg'''. Outros colaboradores autenticados podem utilizar este espaço para deixar mensagens, sugestões e orientações sobre edições.

=== Boas-vindas ===
Olá, '''${userName}'''! Seja muito bem-vindo(a) à comunidade WikiWazzimaGiygg.
* Você pode usar esta página para receber notificações de outros editores.
* Para iniciar uma nova conversa, use o botão de novo tópico ou edite esta seção.
* Lembre-se sempre de manter uma comunicação respeitosa e construtiva.

[[Categoria:Discussões_de_Usuários]]`;

  return savePage({
    slug: slugify(title),
    title,
    content,
    summary: 'Criação automática de página de discussão de usuário no primeiro acesso',
    author: userName,
    authorId: uid,
    namespace: 'Talk',
  });
}

// 7. BUREAUCRAT PERMISSIONS & AUDIT LOGS

export function isUserBureaucrat(user?: { email?: string | null; groups?: UserGroup[] } | null): boolean {
  if (!user) return false;
  if (user.email && user.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return Boolean(user.groups?.includes('burocrata'));
}

export async function getUserRights(uid: string): Promise<UserRightsRecord | null> {
  try {
    const docRef = doc(db, USER_ROLES_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserRightsRecord;
    }
  } catch (error) {
    console.warn(`Firestore getUserRights error for ${uid}:`, error);
  }
  return null;
}

export function subscribeToUserRights(
  uid: string,
  callback: (record: UserRightsRecord | null) => void
): Unsubscribe {
  const docRef = doc(db, USER_ROLES_COLLECTION, uid);
  return onSnapshot(
    docRef,
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserRightsRecord);
      } else {
        callback(null);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for user rights ${uid}:`, error);
      callback(null);
    }
  );
}

export function subscribeToAllUserRights(
  callback: (records: UserRightsRecord[]) => void
): Unsubscribe {
  const colRef = collection(db, USER_ROLES_COLLECTION);
  return onSnapshot(
    colRef,
    snapshot => {
      const records: UserRightsRecord[] = [];
      snapshot.forEach(docSnap => {
        records.push(docSnap.data() as UserRightsRecord);
      });
      records.sort((a, b) => a.username.localeCompare(b.username));
      callback(records);
    },
    error => {
      console.warn('Firestore onSnapshot error for all user rights:', error);
      callback([]);
    }
  );
}

export function subscribeToBureaucratLogs(
  callback: (logs: BureaucratLogEntry[]) => void,
  maxCount = 50
): Unsubscribe {
  const colRef = collection(db, BUREAUCRAT_LOGS_COLLECTION);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    snapshot => {
      const logs: BureaucratLogEntry[] = [];
      snapshot.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as BureaucratLogEntry);
      });
      callback(logs);
    },
    error => {
      console.warn('Firestore onSnapshot error for bureaucrat logs:', error);
      callback([]);
    }
  );
}

export async function saveUserRights(params: {
  bureaucrat: { uid: string; username: string };
  targetUid: string;
  targetName: string;
  targetEmail?: string;
  newGroups: UserGroup[];
  previousGroups: UserGroup[];
  reason: string;
  expiry?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const added = params.newGroups.filter(g => !params.previousGroups.includes(g));
  const removed = params.previousGroups.filter(g => !params.newGroups.includes(g));

  const rightsRecord: UserRightsRecord = {
    uid: params.targetUid,
    username: params.targetName,
    email: params.targetEmail,
    groups: params.newGroups,
    updatedAt: now,
    updatedBy: params.bureaucrat.username,
    updatedByUid: params.bureaucrat.uid,
  };

  const logEntry: BureaucratLogEntry = {
    timestamp: now,
    bureaucratUid: params.bureaucrat.uid,
    bureaucratName: params.bureaucrat.username,
    targetUid: params.targetUid,
    targetName: params.targetName,
    addedGroups: added,
    removedGroups: removed,
    reason: params.reason.trim() || 'Nenhum motivo fornecido',
    expiry: params.expiry || 'Indefinido',
  };

  try {
    await setDoc(doc(db, USER_ROLES_COLLECTION, params.targetUid), rightsRecord);
    await addDoc(collection(db, BUREAUCRAT_LOGS_COLLECTION), logEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USER_ROLES_COLLECTION}/${params.targetUid}`);
  }
}

// 8. PAGE PROTECTION LEVEL SYSTEM (LOCKED, SEMI-PROTECTED, UNPROTECTED)

/**
 * Checks if a protection rule is currently active, validating expiration if set.
 */
export function isPageProtectionActive(page?: WikiPage | null): boolean {
  if (!page) return false;
  const level = page.protectionLevel || (page.isLocked ? 'locked' : 'unprotected');
  if (level === 'unprotected') return false;

  if (page.protectionExpiry && page.protectionExpiry !== 'infinity' && page.protectionExpiry !== 'Indefinido') {
    try {
      const expiryDate = new Date(page.protectionExpiry);
      if (!isNaN(expiryDate.getTime()) && expiryDate.getTime() <= Date.now()) {
        return false; // Protection has expired
      }
    } catch {
      // Ignore parse failure, keep protection active
    }
  }

  return true;
}

/**
 * Returns effective protection level, taking expiry into account.
 */
export function getEffectiveProtectionLevel(page?: WikiPage | null): PageProtectionLevel {
  if (!page) return 'unprotected';
  if (!isPageProtectionActive(page)) return 'unprotected';
  return page.protectionLevel || (page.isLocked ? 'locked' : 'unprotected');
}

/**
 * Evaluates whether a given user has sufficient privileges to edit a page.
 */
export function canUserEditPage(
  page: WikiPage | null,
  user: WikiUser
): { allowed: boolean; reason?: string; isProtected: boolean; level: PageProtectionLevel } {
  // 1. Anonymous users cannot edit any page
  if (user.isAnonymous) {
    return {
      allowed: false,
      reason: 'Contribuições anônimas não são permitidas. Por favor, autentique-se com sua conta Google.',
      isProtected: false,
      level: 'unprotected',
    };
  }

  // 2. Blocked accounts cannot edit
  if (user.isBlocked) {
    return {
      allowed: false,
      reason: 'Sua conta está bloqueada no wiki pela administração comunitária.',
      isProtected: false,
      level: 'unprotected',
    };
  }

  // 3. New page creation
  if (!page) {
    return { allowed: true, isProtected: false, level: 'unprotected' };
  }

  const effectiveLevel = getEffectiveProtectionLevel(page);
  const isProtected = effectiveLevel !== 'unprotected';

  if (!isProtected) {
    return { allowed: true, isProtected: false, level: 'unprotected' };
  }

  // 4. Locked / Fully protected page (only Bureaucrats and Sysops / Admins)
  if (effectiveLevel === 'locked') {
    if (user.isBureaucrat || user.isAdmin) {
      return { allowed: true, isProtected: true, level: 'locked' };
    }
    return {
      allowed: false,
      reason:
        page.protectionReason ||
        'Esta página está bloqueada (totalmente protegida). Apenas administradores e burocratas podem editá-la.',
      isProtected: true,
      level: 'locked',
    };
  }

  // 5. Semi-protected page (Confirmed users, rollbackers, auto-reviewers, admins, bureaucrats)
  if (effectiveLevel === 'semi_protected') {
    const isConfirmedOrPrivileged =
      user.isBureaucrat ||
      user.isAdmin ||
      user.groups?.includes('confirmado') ||
      user.groups?.includes('autorrevisor') ||
      user.groups?.includes('reversor') ||
      user.groups?.includes('eliminador') ||
      (user.editCount && user.editCount >= 3);

    if (isConfirmedOrPrivileged) {
      return { allowed: true, isProtected: true, level: 'semi_protected' };
    }

    return {
      allowed: false,
      reason:
        page.protectionReason ||
        'Esta página está semiprotegida contra edições de contas não confirmadas ou recém-criadas.',
      isProtected: true,
      level: 'semi_protected',
    };
  }

  return { allowed: true, isProtected: false, level: 'unprotected' };
}

/**
 * Persists a new protection level for a wiki page in Firestore, recording audit logs.
 */
export async function setPageProtection(params: {
  pageSlug: string;
  pageTitle?: string;
  level: PageProtectionLevel;
  reason: string;
  expiry?: string;
  bureaucrat: { uid: string; username: string };
}): Promise<void> {
  const slug = slugify(params.pageSlug);
  const now = new Date().toISOString();

  const existingSnap = await getDoc(doc(db, WIKI_PAGES_COLLECTION, slug));
  if (!existingSnap.exists()) {
    throw new Error(`A página "${slug}" não foi localizada no Firestore.`);
  }

  const existingPage = existingSnap.data() as WikiPage;
  const previousLevel: PageProtectionLevel =
    existingPage.protectionLevel || (existingPage.isLocked ? 'locked' : 'unprotected');
  const action: 'protect' | 'unprotect' | 'modify' =
    params.level === 'unprotected'
      ? 'unprotect'
      : previousLevel === 'unprotected'
      ? 'protect'
      : 'modify';

  const isLocked = params.level === 'locked';

  // 1. Update page document in Firestore
  const updatePayload: Partial<WikiPage> = {
    protectionLevel: params.level,
    isLocked,
    protectionReason: params.level === 'unprotected' ? '' : params.reason.trim() || 'Sem motivo especificado',
    protectedBy: params.level === 'unprotected' ? '' : params.bureaucrat.username,
    protectedByUid: params.level === 'unprotected' ? '' : params.bureaucrat.uid,
    protectedAt: params.level === 'unprotected' ? '' : now,
    protectionExpiry: params.level === 'unprotected' ? '' : (params.expiry || 'infinity'),
    updatedAt: now,
  };

  await setDoc(doc(db, WIKI_PAGES_COLLECTION, slug), updatePayload, { merge: true });

  // 2. Add entry to page_protection_logs
  const logEntry: PageProtectionLogEntry = {
    pageSlug: slug,
    pageTitle: existingPage.title || params.pageTitle || slug,
    action,
    previousLevel,
    newLevel: params.level,
    reason: params.reason.trim() || 'Sem motivo especificado',
    expiry: params.expiry || 'infinity',
    performedBy: params.bureaucrat.username,
    performedByUid: params.bureaucrat.uid,
    timestamp: now,
  };

  await addDoc(collection(db, PAGE_PROTECTION_LOGS_COLLECTION), logEntry);

  // 3. Register in general bureaucrat audit log
  await addDoc(collection(db, BUREAUCRAT_LOGS_COLLECTION), {
    timestamp: now,
    bureaucratUid: params.bureaucrat.uid,
    bureaucratName: params.bureaucrat.username,
    targetUid: slug,
    targetName: `Página: ${existingPage.title}`,
    addedGroups: [],
    removedGroups: [],
    reason: `Proteção alterada para [${params.level}]. Motivo: ${params.reason.trim() || 'Sem motivo'}`,
    expiry: params.expiry || 'infinity',
  });
}

/**
 * Real-time listener for page protection audit log entries.
 */
export function subscribeToPageProtectionLogs(
  callback: (logs: PageProtectionLogEntry[]) => void,
  maxCount = 50
): Unsubscribe {
  const colRef = collection(db, PAGE_PROTECTION_LOGS_COLLECTION);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    snapshot => {
      const logs: PageProtectionLogEntry[] = [];
      snapshot.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as PageProtectionLogEntry);
      });
      callback(logs);
    },
    error => {
      console.warn('Firestore onSnapshot error for protection logs:', error);
      callback([]);
    }
  );
}

/**
 * Real-time listener for all currently protected pages in the wiki.
 */
export function subscribeToProtectedPages(
  callback: (pages: WikiPage[]) => void
): Unsubscribe {
  const colRef = collection(db, WIKI_PAGES_COLLECTION);

  return onSnapshot(
    colRef,
    snapshot => {
      const protectedPages: WikiPage[] = [];
      snapshot.forEach(docSnap => {
        const page = docSnap.data() as WikiPage;
        if (isPageProtectionActive(page)) {
          protectedPages.push(page);
        }
      });
      protectedPages.sort((a, b) => a.title.localeCompare(b.title));
      callback(protectedPages);
    },
    error => {
      console.warn('Firestore onSnapshot error for protected pages:', error);
      callback([]);
    }
  );
}


