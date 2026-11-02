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
import { WikiPage, PageRevision, RecentChange, PageNamespace, TalkComment, WikiSettings } from '../types/wiki';
import { INITIAL_PAGES } from '../core/defaultPages';
import { slugify } from '../core/parser';

const WIKI_PAGES_COLLECTION = 'wiki_pages';
const RECENT_CHANGES_COLLECTION = 'recent_changes';
const WIKI_SETTINGS_COLLECTION = 'wiki_settings';

let isSeeding = false;

// Ensure initial pages exist in Firestore
export async function seedInitialPagesIfNeeded(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const mainDocRef = doc(db, WIKI_PAGES_COLLECTION, 'Página_principal');
    const snap = await getDoc(mainDocRef);

    if (!snap.exists()) {
      console.log('Seeding initial MediaWiki articles to Firestore...');
      for (const [slug, page] of Object.entries(INITIAL_PAGES)) {
        await setDoc(doc(db, WIKI_PAGES_COLLECTION, slug), page);

        // Add initial revision
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

        // Add initial recent change
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
    }
  } catch (error) {
    console.warn('Could not seed to Firestore (may be offline or restricted). Fallbacks active.', error);
  } finally {
    isSeeding = false;
  }
}

// 1. REAL-TIME PAGE SUBSCRIPTION
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
      } else if (INITIAL_PAGES[slug]) {
        callback(INITIAL_PAGES[slug]);
      } else {
        callback(null);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for page ${slug}, using fallback:`, error);
      if (INITIAL_PAGES[slug]) {
        callback(INITIAL_PAGES[slug]);
      } else {
        callback(null);
      }
    }
  );
}

// 2. REAL-TIME ALL PAGES SUBSCRIPTION
export function subscribeToAllPages(
  callback: (pages: WikiPage[]) => void
): Unsubscribe {
  const path = WIKI_PAGES_COLLECTION;
  const colRef = collection(db, WIKI_PAGES_COLLECTION);

  return onSnapshot(
    colRef,
    snapshot => {
      const pages: WikiPage[] = [];
      const seen = new Set<string>();

      snapshot.docs.forEach(docSnap => {
        const page = docSnap.data() as WikiPage;
        pages.push(page);
        seen.add(page.slug);
      });

      // Merge any local initial pages not yet in Firestore
      for (const [slug, p] of Object.entries(INITIAL_PAGES)) {
        if (!seen.has(slug)) {
          pages.push(p);
        }
      }

      pages.sort((a, b) => a.title.localeCompare(b.title));
      callback(pages);
    },
    error => {
      console.warn('Firestore onSnapshot error for all pages:', error);
      const fallbackList = Object.values(INITIAL_PAGES).sort((a, b) => a.title.localeCompare(b.title));
      callback(fallbackList);
    }
  );
}

// 3. REAL-TIME REVISIONS SUBSCRIPTION
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
      } else if (INITIAL_PAGES[slug]) {
        const fallback = INITIAL_PAGES[slug];
        callback([
          {
            revId: fallback.latestRevisionId,
            pageId: slug,
            pageTitle: fallback.title,
            content: fallback.content,
            summary: fallback.summary,
            timestamp: fallback.updatedAt,
            author: fallback.author,
            authorId: fallback.authorId,
            byteSize: new Blob([fallback.content]).size,
            minorEdit: false,
          },
        ]);
      } else {
        callback([]);
      }
    },
    error => {
      console.warn(`Firestore onSnapshot error for revisions of ${slug}:`, error);
      if (INITIAL_PAGES[slug]) {
        const fallback = INITIAL_PAGES[slug];
        callback([
          {
            revId: fallback.latestRevisionId,
            pageId: slug,
            pageTitle: fallback.title,
            content: fallback.content,
            summary: fallback.summary,
            timestamp: fallback.updatedAt,
            author: fallback.author,
            authorId: fallback.authorId,
            byteSize: new Blob([fallback.content]).size,
            minorEdit: false,
          },
        ]);
      } else {
        callback([]);
      }
    }
  );
}

// 4. REAL-TIME RECENT CHANGES SUBSCRIPTION
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
        // Fallback to initial pages
        const fallbackChanges = Object.values(INITIAL_PAGES).map(p => ({
          pageId: p.slug,
          pageTitle: p.title,
          author: p.author,
          authorId: p.authorId,
          summary: p.summary,
          timestamp: p.updatedAt,
          oldLen: 0,
          newLen: new Blob([p.content]).size,
          revId: p.latestRevisionId,
          minorEdit: false,
        }));
        callback(fallbackChanges);
      }
    },
    error => {
      console.warn('Firestore onSnapshot error for recent changes:', error);
      const fallbackChanges = Object.values(INITIAL_PAGES).map(p => ({
        pageId: p.slug,
        pageTitle: p.title,
        author: p.author,
        authorId: p.authorId,
        summary: p.summary,
        timestamp: p.updatedAt,
        oldLen: 0,
        newLen: new Blob([p.content]).size,
        revId: p.latestRevisionId,
        minorEdit: false,
      }));
      callback(fallbackChanges);
    }
  );
}

// 5. REAL-TIME TALK TOPICS SUBSCRIPTION
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
        // Default initial welcome comment
        callback([
          {
            id: 'talk_initial',
            pageId: slug,
            topicTitle: 'Boas-vindas à discussão',
            content: `Página de discussão conectada em tempo real com o Firestore. Assine suas mensagens com \`--~~~~\`.`,
            author: 'Sistema MediaWiki TS',
            timestamp: new Date().toISOString(),
          },
        ]);
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

// 6. REAL-TIME SETTINGS SUBSCRIPTION
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

// One-shot functions
export async function getPage(rawSlug: string): Promise<WikiPage | null> {
  const slug = slugify(rawSlug);
  try {
    const pageRef = doc(db, WIKI_PAGES_COLLECTION, slug);
    const snap = await getDoc(pageRef);

    if (snap.exists()) {
      return snap.data() as WikiPage;
    }
  } catch (error) {
    console.warn(`Firestore getPage error for ${slug}, checking fallback seed:`, error);
  }

  if (INITIAL_PAGES[slug]) {
    return INITIAL_PAGES[slug];
  }

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
}): Promise<WikiPage> {
  const slug = slugify(params.slug);
  const path = `${WIKI_PAGES_COLLECTION}/${slug}`;
  const now = new Date().toISOString();
  const byteSize = new Blob([params.content]).size;
  const revId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let namespace: PageNamespace = params.namespace || 'Main';
  if (params.title.startsWith('Ajuda:') || params.title.startsWith('Help:')) namespace = 'Help';
  else if (params.title.startsWith('Discussão:') || params.title.startsWith('Talk:')) namespace = 'Talk';
  else if (params.title.startsWith('Especial:') || params.title.startsWith('Special:')) namespace = 'Special';
  else if (params.title.startsWith('Manual:')) namespace = 'Manual';
  else if (params.title.startsWith('Predefinição:') || params.title.startsWith('Template:')) namespace = 'Template';
  else if (params.title.startsWith('Categoria:') || params.title.startsWith('Category:')) namespace = 'Category';

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
    if (INITIAL_PAGES[slug]) {
      existingPage = INITIAL_PAGES[slug];
      oldLen = new Blob([existingPage.content]).size;
    }
  }

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

  const fallback = INITIAL_PAGES[slug];
  if (fallback) {
    return [
      {
        revId: fallback.latestRevisionId,
        pageId: slug,
        pageTitle: fallback.title,
        content: fallback.content,
        summary: fallback.summary,
        timestamp: fallback.updatedAt,
        author: fallback.author,
        authorId: fallback.authorId,
        byteSize: new Blob([fallback.content]).size,
        minorEdit: false,
      },
    ];
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

  return Object.values(INITIAL_PAGES).map(p => ({
    pageId: p.slug,
    pageTitle: p.title,
    author: p.author,
    authorId: p.authorId,
    summary: p.summary,
    timestamp: p.updatedAt,
    oldLen: 0,
    newLen: new Blob([p.content]).size,
    revId: p.latestRevisionId,
    minorEdit: false,
  }));
}

export async function getAllPagesList(namespaceFilter?: PageNamespace): Promise<WikiPage[]> {
  const pages: WikiPage[] = [];
  const slugsSeen = new Set<string>();

  try {
    const snap = await getDocs(collection(db, WIKI_PAGES_COLLECTION));
    snap.forEach(d => {
      const page = d.data() as WikiPage;
      if (!namespaceFilter || page.namespace === namespaceFilter) {
        pages.push(page);
        slugsSeen.add(page.slug);
      }
    });
  } catch (error) {
    console.warn('Could not fetch all pages from Firestore, using initial pages:', error);
  }

  for (const [slug, p] of Object.entries(INITIAL_PAGES)) {
    if (!slugsSeen.has(slug)) {
      if (!namespaceFilter || p.namespace === namespaceFilter) {
        pages.push(p);
      }
    }
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
