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
    // If not found in Firestore, existingPage is null
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
