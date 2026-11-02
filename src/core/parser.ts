import { TOCItem } from '../types/wiki';

export interface ParseResult {
  html: string;
  toc: TOCItem[];
  categories: string[];
  references: string[];
}

export function parseWikitext(
  wikitext: string,
  existingPages: Set<string> = new Set()
): ParseResult {
  if (!wikitext) {
    return { html: '', toc: [], categories: [], references: [] };
  }

  let text = wikitext;
  const categories: string[] = [];
  const references: string[] = [];
  const toc: TOCItem[] = [];

  // 1. Extract Categories [[Categoria:...]] or [[Category:...]]
  text = text.replace(/\[\[(?:Categoria|Category):([^\]]+)\]\]/gi, (_, catName) => {
    const trimmed = catName.trim();
    if (!categories.includes(trimmed)) {
      categories.push(trimmed);
    }
    return ''; // remove from body text
  });

  // 2. Extract Footnotes / References <ref>...</ref>
  text = text.replace(/<ref>(.*?)<\/ref>/gis, (_, refContent) => {
    references.push(refContent.trim());
    const refIndex = references.length;
    return `__REF_${refIndex}__`;
  });

  // 3. Process Code blocks: <syntaxhighlight> and <pre>
  const codeBlocks: string[] = [];
  text = text.replace(/<syntaxhighlight(?: lang="([^"]*)")?>(.*?)<\/syntaxhighlight>/gis, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    const escaped = escapeHtml(code.trim());
    codeBlocks.push(
      `<div class="my-4 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto text-xs font-mono">
        ${lang ? `<div class="px-3 py-1 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-sans font-semibold">${escapeHtml(lang)}</div>` : ''}
        <pre class="p-3 leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre"><code>${escaped}</code></pre>
      </div>`
    );
    return placeholder;
  });

  // 4. Process Wikitables: {| ... |}
  text = text.replace(/\{\|([\s\S]*?)\|\}/g, (_, tableContent) => {
    return parseWikitable(tableContent);
  });

  // 5. Process Infoboxes: {{Infobox ... | key = val }}
  text = text.replace(/\{\{Infobox([\s\S]*?)\}\}/gi, (_, boxContent) => {
    return parseInfobox(boxContent);
  });

  // 6. Process Notices / Alerts: {{Aviso|...}} or {{Notice|...}}
  text = text.replace(/\{\{(?:Aviso|Notice)\|([\s\S]*?)\}\}/gi, (_, noticeContent) => {
    return `<div class="my-3 p-3 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-xs">
      <span class="text-amber-600 dark:text-amber-400 font-bold">ℹ</span>
      <div>${parseInlineWikitext(noticeContent.trim(), existingPages)}</div>
    </div>`;
  });

  // 7. Parse Headings & collect TOC: == Heading ==, === Sub ===
  let headingCounters = [0, 0, 0, 0];
  let sectionIndex = 0;

  text = text.replace(/^(={1,4})\s*(.*?)\s*\1$/gm, (_, levelStr, title) => {
    const level = levelStr.length;
    const cleanTitle = title.trim();
    const id = slugify(cleanTitle);

    // Update numbering
    if (level === 2) {
      headingCounters[0]++;
      headingCounters[1] = 0;
      headingCounters[2] = 0;
    } else if (level === 3) {
      headingCounters[1]++;
      headingCounters[2] = 0;
    } else if (level === 4) {
      headingCounters[2]++;
    }

    const numberStr = level === 1 ? '' :
      level === 2 ? `${headingCounters[0]}` :
      level === 3 ? `${headingCounters[0]}.${headingCounters[1]}` :
      `${headingCounters[0]}.${headingCounters[1]}.${headingCounters[2]}`;

    if (level >= 2) {
      toc.push({
        id,
        level,
        text: cleanTitle,
        number: numberStr,
      });
    }

    sectionIndex++;
    const currentSection = sectionIndex;

    const baseClass = "group font-serif font-medium text-gray-900 dark:text-gray-100 flex items-baseline justify-between";
    if (level === 1) {
      return `<h1 id="${id}" class="${baseClass} text-2xl pb-1 mb-3 border-b border-gray-300 dark:border-gray-700">
        <span>${escapeHtml(cleanTitle)}</span>
      </h1>`;
    } else if (level === 2) {
      return `<h2 id="${id}" class="${baseClass} text-xl mt-6 pb-1 mb-2 border-b border-gray-300 dark:border-gray-700">
        <span class="mw-headline">${escapeHtml(cleanTitle)}</span>
        <button type="button" data-section="${currentSection}" class="mw-section-edit text-xs font-sans text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 hover:underline cursor-pointer ml-3">[editar]</button>
      </h2>`;
    } else if (level === 3) {
      return `<h3 id="${id}" class="${baseClass} text-lg font-semibold mt-4 mb-1">
        <span class="mw-headline">${escapeHtml(cleanTitle)}</span>
        <button type="button" data-section="${currentSection}" class="mw-section-edit text-xs font-sans text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 hover:underline cursor-pointer ml-3">[editar]</button>
      </h3>`;
    } else {
      return `<h4 id="${id}" class="${baseClass} text-base font-semibold mt-3 mb-1">
        <span class="mw-headline">${escapeHtml(cleanTitle)}</span>
        <button type="button" data-section="${currentSection}" class="mw-section-edit text-xs font-sans text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 hover:underline cursor-pointer ml-3">[editar]</button>
      </h4>`;
    }
  });

  // 8. Process Lists (* and #)
  text = parseLists(text);

  // 9. Process Paragraphs
  const rawParagraphs = text.split(/\n\s*\n/);
  const formattedParagraphs = rawParagraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // If it's already an HTML block or code placeholder, don't wrap in <p>
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('__CODE_BLOCK_')
    ) {
      return trimmed;
    }
    return `<p class="my-3 leading-relaxed text-[14.5px] text-gray-800 dark:text-gray-200">${trimmed}</p>`;
  });
  text = formattedParagraphs.join('\n\n');

  // 10. Process Inline Wikitext (bold, italic, links, etc.)
  text = parseInlineWikitext(text, existingPages);

  // 11. Restore Code Blocks
  codeBlocks.forEach((blockHtml, index) => {
    text = text.replaceAll(`__CODE_BLOCK_${index}__`, blockHtml);
  });

  // 12. References Placeholder Replacement
  text = text.replace(/__REF_(\d+)__/g, (_, refNum) => {
    return `<sup class="reference" id="cite_ref-${refNum}"><a href="#cite_note-${refNum}" class="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[11px] font-medium">[${refNum}]</a></sup>`;
  });

  // 13. Handle <references /> tag
  const referencesHtml = references.length > 0 ? `
    <div class="mw-references-wrap my-4 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
      <h3 class="font-serif font-medium text-base mb-2 text-gray-800 dark:text-gray-200">Referências</h3>
      <ol class="list-decimal pl-6 space-y-1 text-gray-600 dark:text-gray-400">
        ${references.map((ref, idx) => `
          <li id="cite_note-${idx + 1}" class="leading-normal">
            <span class="mr-1 text-blue-600 dark:text-blue-400"><a href="#cite_ref-${idx + 1}">↑</a></span>
            ${parseInlineWikitext(ref, existingPages)}
          </li>
        `).join('')}
      </ol>
    </div>
  ` : '';

  if (text.includes('<references />') || text.includes('{{reflist}}')) {
    text = text.replace(/<references\s*\/?>|\{\{reflist\}\}/gi, referencesHtml);
  } else if (references.length > 0 && !text.includes('cite_note-')) {
    text += referencesHtml;
  }

  return {
    html: text,
    toc,
    categories,
    references,
  };
}

function parseInlineWikitext(input: string, existingPages: Set<string>): string {
  let text = input;

  // Bold & Italic: '''''text'''''
  text = text.replace(/'''''(.*?)'''''/g, '<strong><em>$1</em></strong>');
  // Bold: '''text'''
  text = text.replace(/'''(.*?)'''/g, '<strong>$1</strong>');
  // Italic: ''text''
  text = text.replace(/''(.*?)''/g, '<em>$1</em>');
  // Strike: <s>text</s>
  text = text.replace(/<s>(.*?)<\/s>/gi, '<del class="line-through text-gray-500">$1</del>');
  // Underline: <u>text</u>
  text = text.replace(/<u>(.*?)<\/u>/gi, '<u class="underline">$1</u>');

  // Internal Links: [[Target]] or [[Target|Label]]
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, customLabel) => {
    const rawTarget = target.trim();
    const cleanTarget = rawTarget.replace(/\s+/g, '_');
    const label = customLabel ? customLabel.trim() : rawTarget;

    // Check if target page exists (or default page)
    const pageExists = existingPages.has(cleanTarget) || existingPages.has(rawTarget);

    if (pageExists) {
      return `<a href="#/wiki/${encodeURIComponent(cleanTarget)}" class="mw-wiki-link text-[#0645ad] dark:text-[#6ba4ff] hover:underline" data-target="${escapeHtml(cleanTarget)}">${escapeHtml(label)}</a>`;
    } else {
      // Red link for uncreated pages! MediaWiki's trademark feature
      return `<a href="#/wiki/${encodeURIComponent(cleanTarget)}?action=edit" class="mw-new-link text-[#ba0000] dark:text-[#ff7878] hover:underline cursor-pointer" title="${escapeHtml(rawTarget)} (página ainda não criada)" data-target="${escapeHtml(cleanTarget)}">${escapeHtml(label)}</a>`;
    }
  });

  // External Links: [https://example.com Label] or plain URLs
  text = text.replace(/\[((?:https?:\/\/)[^\s\]]+)(?:\s+([^\]]+))?\]/gi, (_, url, label) => {
    const textLabel = label ? label.trim() : url;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="mw-external-link text-[#3366cc] dark:text-[#729fcf] hover:underline inline-flex items-center gap-0.5"><span>${escapeHtml(textLabel)}</span><span class="text-[10px] opacity-70">↗</span></a>`;
  });

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-mono text-xs">$1</code>');

  return text;
}

function parseLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('*')) {
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul class="list-disc pl-6 my-2 space-y-1 text-gray-800 dark:text-gray-200 text-[14px]">');
        inUl = true;
      }
      const itemContent = line.replace(/^\*+\s*/, '');
      result.push(`<li>${itemContent}</li>`);
    } else if (line.startsWith('#')) {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        result.push('<ol class="list-decimal pl-6 my-2 space-y-1 text-gray-800 dark:text-gray-200 text-[14px]">');
        inOl = true;
      }
      const itemContent = line.replace(/^#+\s*/, '');
      result.push(`<li>${itemContent}</li>`);
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      result.push(line);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}

function parseWikitable(content: string): string {
  const lines = content.split('\n');
  let html = '<div class="overflow-x-auto my-4"><table class="wikitable w-full text-left text-xs md:text-sm border-collapse border border-[#a2a9b1] dark:border-gray-700 bg-[#f8f9fa] dark:bg-gray-900">';
  let inRow = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('|+')) {
      const caption = line.substring(2).trim();
      html += `<caption class="p-2 font-bold text-gray-800 dark:text-gray-200 text-sm">${escapeHtml(caption)}</caption>`;
    } else if (line.startsWith('|-')) {
      if (inRow) html += '</tr>';
      html += '<tr class="border-b border-[#a2a9b1] dark:border-gray-700">';
      inRow = true;
    } else if (line.startsWith('!')) {
      if (!inRow) {
        html += '<tr class="border-b border-[#a2a9b1] dark:border-gray-700">';
        inRow = true;
      }
      const headers = line.substring(1).split('!!');
      headers.forEach(h => {
        html += `<th class="p-2 bg-[#eaecf0] dark:bg-gray-800 font-semibold border-r border-[#a2a9b1] dark:border-gray-700 text-gray-900 dark:text-gray-100">${h.trim()}</th>`;
      });
    } else if (line.startsWith('|') && !line.startsWith('|}')) {
      if (!inRow) {
        html += '<tr class="border-b border-[#a2a9b1] dark:border-gray-700">';
        inRow = true;
      }
      const cells = line.substring(1).split('||');
      cells.forEach(c => {
        html += `<td class="p-2 border-r border-[#a2a9b1] dark:border-gray-700 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900/60">${c.trim()}</td>`;
      });
    }
  }

  if (inRow) html += '</tr>';
  html += '</table></div>';
  return html;
}

function parseInfobox(content: string): string {
  const lines = content.split('\n');
  let title = 'Informações';
  let imageSrc = '';
  const fields: { key: string; value: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      const parts = trimmed.substring(1).split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim().replace(/_/g, ' ');
        const value = parts.slice(1).join('=').trim();
        const lowerKey = key.toLowerCase();

        if (lowerKey === 'nome' || lowerKey === 'título' || lowerKey === 'titulo') {
          title = value;
        } else if (lowerKey === 'logo' || lowerKey === 'logotipo' || lowerKey === 'imagem') {
          imageSrc = value;
        } else if (value) {
          fields.push({ key: key.charAt(0).toUpperCase() + key.slice(1), value });
        }
      }
    }
  }

  let html = `
    <div class="infobox float-none md:float-right md:ml-6 mb-4 w-full md:w-80 rounded border border-[#a2a9b1] dark:border-gray-700 bg-[#f8f9fa] dark:bg-gray-800 p-3 shadow-xs text-xs">
      <div class="bg-[#eaecf0] dark:bg-gray-700 p-2 font-serif font-bold text-center text-sm text-gray-900 dark:text-gray-100 rounded-t mb-2">
        ${escapeHtml(title)}
      </div>
      ${imageSrc ? `
        <div class="my-2 p-2 bg-white dark:bg-black rounded border border-gray-200 dark:border-gray-700 flex justify-center">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(title)}" class="max-h-28 object-contain" />
        </div>
      ` : ''}
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
  `;

  for (const field of fields) {
    html += `
      <div class="py-1.5 flex justify-between gap-2">
        <span class="font-semibold text-gray-600 dark:text-gray-400 w-1/3">${escapeHtml(field.key)}</span>
        <span class="text-gray-900 dark:text-gray-100 w-2/3 text-right break-words">${field.value}</span>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[\s/]+/g, '_')
    .replace(/[^\w\u00C0-\u024F_:.-]/g, '');
}
