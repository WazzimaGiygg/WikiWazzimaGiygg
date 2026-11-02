import { getAllPagesList } from '../services/wikiService';

export async function getRandomPageSlug(): Promise<string> {
  try {
    const pages = await getAllPagesList();
    if (pages.length > 0) {
      // Pick pages from Main namespace preferentially
      const mainPages = pages.filter(p => p.namespace === 'Main');
      const pool = mainPages.length > 0 ? mainPages : pages;
      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex].slug;
    }
  } catch (err) {
    console.warn('Failed to get random page:', err);
  }
  return 'MediaWiki';
}
