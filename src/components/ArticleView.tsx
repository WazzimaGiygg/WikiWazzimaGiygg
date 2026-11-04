import React, { useState, useMemo, useEffect } from 'react';
import {
  Edit3,
  History,
  MessageSquare,
  Eye,
  Star,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
  Calendar,
  User,
  AlertCircle,
  Tag,
  ArrowRight,
  Lock,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiPage } from '../types/wiki';
import { parseWikitext } from '../core/parser';
import { canUserEditPage, getEffectiveProtectionLevel } from '../services/wikiService';
import { getFileDoc } from '../services/extensionService';
import { WikiFileDoc } from '../extensions/types';
import { PageProtectionModal } from './PageProtectionModal';

interface ArticleViewProps {
  page: WikiPage | null;
  slug: string;
  onEdit: (section?: number) => void;
  onViewHistory: () => void;
  onViewTalk: () => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  page,
  slug,
  onEdit,
  onViewHistory,
  onViewTalk,
}) => {
  const { existingPageSlugs, navigateToPage, activeTab, setActiveTab, currentUser, loginWithGoogle } = useWiki();
  const [showTOC, setShowTOC] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [showProtectionModal, setShowProtectionModal] = useState(false);
  const [fileDoc, setFileDoc] = useState<WikiFileDoc | null>(null);

  useEffect(() => {
    const isFile = slug.startsWith('Ficheiro:') || slug.startsWith('File:') || page?.namespace === 'File';
    if (!isFile) {
      setFileDoc(null);
      return;
    }
    getFileDoc(slug).then(doc => {
      setFileDoc(doc);
    });
  }, [slug, page]);

  const effectiveLevel = getEffectiveProtectionLevel(page);
  const editPermission = page
    ? canUserEditPage(page, currentUser)
    : { allowed: !currentUser.isAnonymous, isProtected: false, level: 'unprotected' as const };

  // Parse wikitext whenever page content changes
  const parseResult = useMemo(() => {
    if (!page) return { html: '', toc: [], categories: [], references: [] };
    return parseWikitext(page.content, existingPageSlugs);
  }, [page, existingPageSlugs]);

  // Handle clicks on internal wiki links inside the parsed HTML
  useEffect(() => {
    const handleArticleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button');
      if (!target) return;

      // Section edit button
      if (target.classList.contains('mw-section-edit')) {
        e.preventDefault();
        const sectionNum = target.getAttribute('data-section');
        onEdit(sectionNum ? parseInt(sectionNum, 10) : undefined);
        return;
      }

      // Wiki internal link
      if (target.classList.contains('mw-wiki-link') || target.classList.contains('mw-new-link')) {
        const linkTarget = target.getAttribute('data-target');
        if (linkTarget) {
          e.preventDefault();
          if (target.classList.contains('mw-new-link')) {
            navigateToPage(linkTarget, 'edit');
          } else {
            navigateToPage(linkTarget, 'view');
          }
        }
      }
    };

    const container = document.getElementById('mw-content-text');
    if (container) {
      container.addEventListener('click', handleArticleClick);
      return () => container.removeEventListener('click', handleArticleClick);
    }
  }, [navigateToPage, onEdit]);

  const formattedDate = useMemo(() => {
    if (!page?.updatedAt) return '';
    try {
      const d = new Date(page.updatedAt);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return page.updatedAt;
    }
  }, [page?.updatedAt]);

  // Page does not exist yet state (MediaWiki prompt to create page)
  if (!page) {
    return (
      <div className="py-6">
        <h1 className="text-3xl font-serif font-normal text-gray-900 dark:text-gray-100 border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-4">
          {slug.replace(/_/g, ' ')}
        </h1>

        <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded my-6 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-base mb-1">O WikiWazzimaGiygg não possui esta página salva no Firebase.</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">
                {currentUser.isAnonymous
                  ? 'Contribuições sem login não são permitidas. Para criar e salvar esta página no Firestore, entre com sua conta.'
                  : 'Você pode criar este artigo agora mesmo utilizando a sintaxe de wikitexto. As alterações serão salvas diretamente no Firebase Firestore.'}
              </p>
              {currentUser.isAnonymous ? (
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs shadow-2xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer login para criar esta página</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Criar a página &quot;{slug.replace(/_/g, ' ')}&quot;</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>Dica: Você também pode procurar por páginas similares através da barra de pesquisa no topo.</p>
          <p>Para retornar à página inicial, clique em <button type="button" onClick={() => navigateToPage('Página_principal')} className="text-blue-600 hover:underline">Página principal</button>.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="py-2">
      {/* MediaWiki Vector Action Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#a2a9b1] dark:border-gray-700 text-xs mb-3">
        {/* Left Tabs (Namespace / Talk) */}
        <div className="flex items-center -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`px-3.5 py-1.5 border-t border-r border-l rounded-t transition-colors font-medium ${
              activeTab === 'view'
                ? 'bg-white dark:bg-[#1a1f2c] border-[#a2a9b1] dark:border-gray-700 text-gray-900 dark:text-gray-100 border-b-transparent'
                : 'bg-[#f8f9fa] dark:bg-gray-800/60 border-transparent text-[#0645ad] dark:text-[#6ba4ff] hover:text-blue-800'
            }`}
          >
            {page.namespace === 'Help' ? 'Ajuda' : page.namespace === 'Manual' ? 'Manual' : 'Artigo'}
          </button>
          <button
            type="button"
            onClick={onViewTalk}
            className={`px-3.5 py-1.5 border-t border-r border-l rounded-t transition-colors font-medium flex items-center gap-1 ${
              activeTab === 'talk'
                ? 'bg-white dark:bg-[#1a1f2c] border-[#a2a9b1] dark:border-gray-700 text-gray-900 dark:text-gray-100 border-b-transparent'
                : 'bg-[#f8f9fa] dark:bg-gray-800/60 border-transparent text-[#0645ad] dark:text-[#6ba4ff] hover:text-blue-800'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Discussão</span>
          </button>
        </div>

        {/* Right Tabs (Read / Edit / History / Star) */}
        <div className="flex items-center -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`px-3 py-1.5 border-t border-r border-l rounded-t font-medium flex items-center gap-1 ${
              activeTab === 'view'
                ? 'bg-white dark:bg-[#1a1f2c] border-[#a2a9b1] dark:border-gray-700 text-gray-900 dark:text-gray-100 border-b-transparent'
                : 'bg-[#f8f9fa] dark:bg-gray-800/60 border-transparent text-[#0645ad] dark:text-[#6ba4ff]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Ler</span>
          </button>

          {editPermission.allowed ? (
            <button
              type="button"
              onClick={() => onEdit()}
              className="px-3 py-1.5 border-t border-r border-l border-transparent rounded-t font-medium text-[#0645ad] dark:text-[#6ba4ff] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEdit()}
              className="px-3 py-1.5 border-t border-r border-l border-transparent rounded-t font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
              title={editPermission.reason || 'Página protegida contra alterações'}
            >
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Ver código-fonte</span>
            </button>
          )}

          <button
            type="button"
            onClick={onViewHistory}
            className="px-3 py-1.5 border-t border-r border-l border-transparent rounded-t font-medium text-[#0645ad] dark:text-[#6ba4ff] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
          >
            <History className="w-3 h-3" />
            <span>Ver histórico</span>
          </button>

          {(currentUser.isBureaucrat || currentUser.isAdmin) && (
            <button
              type="button"
              onClick={() => setShowProtectionModal(true)}
              className={`px-3 py-1.5 border-t border-r border-l border-transparent rounded-t font-medium flex items-center gap-1 cursor-pointer ${
                effectiveLevel === 'locked'
                  ? 'text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40'
                  : effectiveLevel === 'semi_protected'
                  ? 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-[#0645ad] dark:text-[#6ba4ff] hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Configurar nível de proteção (bloqueada, semiprotegida)"
            >
              {effectiveLevel === 'locked' ? (
                <Lock className="w-3 h-3 text-red-600 dark:text-red-400" />
              ) : effectiveLevel === 'semi_protected' ? (
                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              )}
              <span>Proteger</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsWatched(prev => !prev)}
            className={`p-1.5 rounded-t text-gray-500 hover:text-amber-500 cursor-pointer ${
              isWatched ? 'text-amber-500' : ''
            }`}
            title={isWatched ? 'Desvigiar esta página' : 'Vigiar esta página'}
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Title (firstHeading) */}
      <div className="mb-4">
        <div className="flex items-center justify-between border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              id="firstHeading"
              className="text-2xl sm:text-3xl font-serif font-normal text-gray-900 dark:text-gray-100"
            >
              {page.title}
            </h1>

            {effectiveLevel === 'locked' && (
              <button
                type="button"
                onClick={() => setShowProtectionModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 hover:opacity-90 cursor-pointer shadow-2xs"
                title={`Página Bloqueada: ${page.protectionReason || 'Apenas administradores e burocratas podem editar'}`}
              >
                <Lock className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span>Bloqueada</span>
              </button>
            )}

            {effectiveLevel === 'semi_protected' && (
              <button
                type="button"
                onClick={() => setShowProtectionModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:opacity-90 cursor-pointer shadow-2xs"
                title={`Página Semiprotegida: ${page.protectionReason || 'Apenas usuários confirmados ou administradores podem editar'}`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Semiprotegida</span>
              </button>
            )}
          </div>
        </div>

        <div id="siteSub" className="text-[11px] text-gray-500 dark:text-gray-400 font-sans italic">
          De WikiWazzimaGiygg, a enciclopédia livre adaptada para TypeScript & Firebase.
        </div>
      </div>

      {/* Protection Alert Banner */}
      {effectiveLevel !== 'unprotected' && (
        <div
          className={`mb-4 p-3 rounded border text-xs flex items-start gap-2.5 ${
            effectiveLevel === 'locked'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          {effectiveLevel === 'locked' ? (
            <Lock className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-semibold text-[13px]">
              {effectiveLevel === 'locked'
                ? 'Esta página está totalmente protegida contra edições (Bloqueada).'
                : 'Esta página está semiprotegida contra edições de contas recentes ou não confirmadas.'}
            </div>
            <p className="text-[11px] mt-0.5 opacity-90">
              {page.protectionReason
                ? `Motivo: ${page.protectionReason}`
                : 'Proteção definida preventivamente pela administração comunitária.'}
              {page.protectedBy && ` • Definida por ${page.protectedBy}`}
              {page.protectionExpiry && page.protectionExpiry !== 'infinity'
                ? ` • Expira em ${new Date(page.protectionExpiry).toLocaleDateString('pt-BR')}`
                : ' • Duração permanente'}
            </p>
          </div>
          {(currentUser.isBureaucrat || currentUser.isAdmin) && (
            <button
              type="button"
              onClick={() => setShowProtectionModal(true)}
              className="text-[11px] underline font-semibold hover:opacity-80 shrink-0 cursor-pointer ml-2"
            >
              Alterar proteção
            </button>
          )}
        </div>
      )}

      {/* Table of Contents (TOC) */}
      {parseResult.toc.length >= 2 && (
        <div className="toc my-4 p-3 max-w-sm rounded border border-[#a2a9b1] dark:border-gray-700 bg-[#f8f9fa] dark:bg-gray-900 text-xs shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-gray-800">
            <span className="font-bold text-gray-800 dark:text-gray-200">Índice</span>
            <button
              type="button"
              onClick={() => setShowTOC(prev => !prev)}
              className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline flex items-center gap-0.5 text-[11px]"
            >
              <span>[{showTOC ? 'ocultar' : 'mostrar'}]</span>
              {showTOC ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showTOC && (
            <nav className="mt-2 space-y-1">
              {parseResult.toc.map(item => (
                <div
                  key={item.id}
                  style={{ paddingLeft: `${(item.level - 2) * 14}px` }}
                  className="leading-snug"
                >
                  <a
                    href={`#${item.id}`}
                    className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline inline-flex items-baseline gap-1.5"
                  >
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                      {item.number}
                    </span>
                    <span>{item.text}</span>
                  </a>
                </div>
              ))}
            </nav>
          )}
        </div>
      )}

      {/* MediaWiki Canonical File Viewer */}
      {fileDoc && (
        <div className="my-4 p-4 bg-[#f8f9fa] dark:bg-gray-850 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs space-y-3">
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded">
            <img
              src={fileDoc.url}
              alt={fileDoc.title}
              className="max-h-96 max-w-full object-contain rounded shadow-xs"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{fileDoc.fileName}</span>
              {' • '}
              {(fileDoc.size / 1024).toFixed(1)} KB
              {fileDoc.width && fileDoc.height && ` • ${fileDoc.width} × ${fileDoc.height} pixels`}
              {' • '}
              <span>{fileDoc.mimeType}</span>
            </div>
            <a
              href={fileDoc.url}
              download={fileDoc.fileName}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar ficheiro em resolução original</span>
            </a>
          </div>
        </div>
      )}

      {/* Rendered Wikitext Body */}
      <div
        id="mw-content-text"
        className="mw-body-content min-h-[300px] leading-relaxed text-gray-800 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: parseResult.html }}
      />

      {/* Categories Box (mw-catlinks) */}
      {parseResult.categories.length > 0 && (
        <div
          id="catlinks"
          className="my-6 p-2 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs flex flex-wrap items-center gap-1.5 text-gray-700 dark:text-gray-300"
        >
          <span className="font-semibold text-gray-500 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Categorias:</span>
          </span>
          {parseResult.categories.map((cat, idx) => (
            <React.Fragment key={cat}>
              {idx > 0 && <span className="text-gray-400">|</span>}
              <button
                type="button"
                onClick={() => navigateToPage(`Categoria:${cat}`)}
                className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline cursor-pointer"
              >
                {cat}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* MediaWiki Article Footer */}
      <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            Esta página foi editada pela última vez às <span className="font-medium">{formattedDate}</span> por{' '}
            <button
              type="button"
              onClick={() => navigateToPage(`Usuário:${page.author}`)}
              className="font-medium text-[#0645ad] dark:text-[#6ba4ff] hover:underline cursor-pointer"
            >
              {page.author}
            </button>.
          </div>
          <div className="font-mono text-[10px]">
            Revisão #{page.revisionCount} ({page.latestRevisionId.slice(0, 10)})
          </div>
        </div>
        <div>
          Conteúdo disponibilizado nos termos da licença{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)
          </a>{' '}
          e da GNU General Public License v2+.
        </div>
      </footer>

      {/* Page Protection Modal */}
      {page && (
        <PageProtectionModal
          page={page}
          isOpen={showProtectionModal}
          onClose={() => setShowProtectionModal(false)}
        />
      )}
    </article>
  );
};
