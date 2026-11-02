import React, { useState, useRef, useMemo } from 'react';
import {
  Bold,
  Italic,
  Link,
  Code,
  List,
  ListOrdered,
  Heading2,
  Table,
  Quote,
  Eye,
  FileDiff,
  Save,
  X,
  Sparkles,
  HelpCircle,
  FileCode,
  Lock,
  LogIn,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiPage } from '../types/wiki';
import { savePage } from '../services/wikiService';
import { parseWikitext } from '../core/parser';
import { computeRevisionDiff } from '../core/diff';

interface EditViewProps {
  page: WikiPage | null;
  slug: string;
  onSaved: (page: WikiPage) => void;
  onCancel: () => void;
  initialSection?: number;
}

export const EditView: React.FC<EditViewProps> = ({
  page,
  slug,
  onSaved,
  onCancel,
}) => {
  const { currentUser, existingPageSlugs, loginWithGoogle } = useWiki();

  const [content, setContent] = useState<string>(() => {
    return page?.content || `== Introdução ==\nEscreva o conteúdo do seu artigo aqui em wikitexto.\n\n== Detalhes ==\n* Item 1\n* Item 2\n\n[[Categoria:Geral]]`;
  });

  const [summary, setSummary] = useState<string>('');
  const [isMinor, setIsMinor] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activePreview, setActivePreview] = useState<'none' | 'preview' | 'diff'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Computed live preview
  const livePreview = useMemo(() => {
    if (activePreview !== 'preview') return null;
    return parseWikitext(content, existingPageSlugs);
  }, [content, activePreview, existingPageSlugs]);

  // Computed diff preview
  const diffRows = useMemo(() => {
    if (activePreview !== 'diff') return [];
    const originalText = page?.content || '';
    return computeRevisionDiff(originalText, content);
  }, [page?.content, content, activePreview]);

  // Insert wikitext snippets
  const insertSyntax = (before: string, after: string = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultPlaceholder;

    const replacement = `${before}${selected}${after}`;
    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.isAnonymous) {
      setErrorMessage('Contribuições não são permitidas sem login. Por favor, entre com sua conta para poder publicar alterações.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('O conteúdo da página não pode estar vazio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const pageTitle = page?.title || slug.replace(/_/g, ' ');
      const saved = await savePage({
        slug,
        title: pageTitle,
        content,
        summary: summary || (page ? 'Edição de conteúdo' : 'Criação inicial da página'),
        author: currentUser.username,
        authorId: currentUser.uid,
        minorEdit: isMinor,
      });

      onSaved(saved);
    } catch (err: any) {
      console.error('Error saving wiki page:', err);
      setErrorMessage('Erro ao salvar no Firestore: ' + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const presetSummaries = [
    'correção ortográfica',
    'atualização técnica',
    'nova seção',
    'formatação de wikitexto',
    'adição de referências',
  ];

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>A editar</span>
          <span className="font-bold underline decoration-blue-500">{page?.title || slug.replace(/_/g, ' ')}</span>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          As alterações serão gravadas na coleção <code className="font-mono text-blue-600 dark:text-blue-400">/wiki_pages/{slug}</code> do Firestore com controle de revisões.
        </div>
      </div>

      {currentUser.isAnonymous && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Login obrigatório para contribuir</div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                O WikiWazzimaGiygg não permite edições sem login. Você pode redigir e pré-visualizar, mas precisará entrar com sua conta Google para publicar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="px-3.5 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar com Google</span>
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* MediaWiki Classic Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#f8f9fa] dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded-t text-xs">
        <button
          type="button"
          onClick={() => insertSyntax("'''", "'''", 'texto em negrito')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Negrito (''')"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax("''", "''", 'texto em itálico')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Itálico ('')"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => insertSyntax('[[', ']]', 'Título da Página')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Link interno ([[...]])"
        >
          <Link className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('\n== ', ' ==\n', 'Título da Seção')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Cabeçalho nível 2 (== ==)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('* ', '', 'Item da lista')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Lista com marcadores (*)"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('# ', '', 'Item numerado')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Lista numerada (#)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => insertSyntax('<syntaxhighlight lang="typescript">\n', '\n</syntaxhighlight>', '// Código TypeScript aqui')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Bloco de código (<syntaxhighlight>)"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('{| class="wikitable"\n! Cabeçalho 1 !! Cabeçalho 2\n|-\n| Linha 1, Coluna 1 || Linha 1, Coluna 2\n|}\n')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Inserir tabela wikitexto"
        >
          <Table className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('<ref>', '</ref>', 'Referência bibliográfica ou link')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-serif font-bold text-xs"
          title="Nota de rodapé (<ref>)"
        >
          [ref]
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('{{Aviso|', '}}', 'Mensagem de alerta importante')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-amber-600 font-bold text-xs"
          title="Predefinição de aviso {{Aviso|...}}"
        >
          {'{aviso}'}
        </button>

        <button
          type="button"
          onClick={() => insertSyntax('--~~~~')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-xs"
          title="Assinatura com data (--~~~~)"
        >
          --~~~~
        </button>
      </div>

      {/* Main Wikitext Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={18}
        className="w-full p-3 font-mono text-xs sm:text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-[#a2a9b1] dark:border-gray-700 border-t-0 focus:outline-hidden focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] resize-y leading-relaxed shadow-inner"
        placeholder="Digite o conteúdo do artigo em wikitexto..."
      />

      {/* Edit Summary & Options Box */}
      <div className="mt-3 p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs space-y-3">
        <div>
          <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
            Resumo da edição (descreva brevemente o que foi alterado):
          </label>
          <input
            type="text"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Ex: correção ortográfica, adição de fontes, atualização técnica..."
            maxLength={250}
            className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs"
          />

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[11px] text-gray-500">Resumos rápidos:</span>
            {presetSummaries.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setSummary(prev => (prev ? `${prev}, ${preset}` : preset))}
                className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-[11px] text-gray-700 dark:text-gray-300"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isMinor}
              onChange={e => setIsMinor(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Esta é uma edição menor</span>
          </label>

          <span className="text-gray-400">|</span>

          <span className="text-gray-500">
            A editar como: <strong className="text-gray-800 dark:text-gray-200">{currentUser.username}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-2">
          {currentUser.isAnonymous ? (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white font-medium rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Faça login com sua conta para poder publicar alterações"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar com Google para publicar</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white font-medium rounded flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'A publicar...' : 'Publicar alterações'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActivePreview(prev => (prev === 'preview' ? 'none' : 'preview'))}
            className={`px-3 py-2 border rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activePreview === 'preview'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{activePreview === 'preview' ? 'Ocultar previsão' : 'Mostrar previsão'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePreview(prev => (prev === 'diff' ? 'none' : 'diff'))}
            className={`px-3 py-2 border rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activePreview === 'diff'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileDiff className="w-3.5 h-3.5" />
            <span>{activePreview === 'diff' ? 'Ocultar alterações' : 'Mostrar alterações (Diff)'}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 ml-auto cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Live Preview Section */}
      {activePreview === 'preview' && livePreview && (
        <div className="mt-6 p-4 rounded border-2 border-dashed border-[#3366cc]/40 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Previsão do Artigo (Esta é apenas uma pré-visualização; as alterações ainda não foram gravadas!)</span>
            </span>
            <button
              type="button"
              onClick={() => setActivePreview('none')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="mw-body-content min-h-[150px] leading-relaxed text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: livePreview.html }}
          />
        </div>
      )}

      {/* Live Diff Preview Section */}
      {activePreview === 'diff' && (
        <div className="mt-6 p-4 rounded border-2 border-dashed border-emerald-500/40 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <FileDiff className="w-4 h-4" />
              <span>Comparação de Alterações com a Versão Atual (Diff)</span>
            </span>
            <button
              type="button"
              onClick={() => setActivePreview('none')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {diffRows.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              Nenhuma alteração detectada em relação à versão original.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded font-mono text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                    <th className="p-1.5 w-1/2 text-left font-sans font-semibold text-red-700 dark:text-red-400">
                      Versão Atual
                    </th>
                    <th className="p-1.5 w-1/2 text-left font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                      Sua Versão (Não salva)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {diffRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                      <td
                        className={`p-1.5 align-top border-r border-gray-200 dark:border-gray-800 ${
                          row.type === 'deleted' || row.type === 'modified'
                            ? 'bg-red-50 dark:bg-red-950/30'
                            : ''
                        }`}
                      >
                        {row.leftContent !== undefined && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-gray-400 select-none w-6 text-right">
                              {row.leftLineNumber}
                            </span>
                            <span
                              className="text-red-900 dark:text-red-200 break-words"
                              dangerouslySetInnerHTML={{ __html: row.leftDiffHtml || '' }}
                            />
                          </div>
                        )}
                      </td>
                      <td
                        className={`p-1.5 align-top ${
                          row.type === 'added' || row.type === 'modified'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30'
                            : ''
                        }`}
                      >
                        {row.rightContent !== undefined && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-gray-400 select-none w-6 text-right">
                              {row.rightLineNumber}
                            </span>
                            <span
                              className="text-emerald-900 dark:text-emerald-200 break-words"
                              dangerouslySetInnerHTML={{ __html: row.rightDiffHtml || '' }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
