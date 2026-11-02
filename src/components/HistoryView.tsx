import React, { useState, useEffect, useMemo } from 'react';
import { History, GitCompare, RotateCcw, Clock, ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { PageRevision, WikiPage } from '../types/wiki';
import { subscribeToPageRevisions, savePage } from '../services/wikiService';
import { computeRevisionDiff, DiffRow } from '../core/diff';
import { parseWikitext } from '../core/parser';

interface HistoryViewProps {
  page: WikiPage | null;
  slug: string;
  onBackToArticle: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ page, slug, onBackToArticle }) => {
  const { currentUser, existingPageSlugs, loginWithGoogle, navigateToPage } = useWiki();

  const [revisions, setRevisions] = useState<PageRevision[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected revisions for comparison (indices)
  const [oldRevIndex, setOldRevIndex] = useState<number>(1);
  const [newRevIndex, setNewRevIndex] = useState<number>(0);

  // Viewing a specific snapshot
  const [viewingRev, setViewingRev] = useState<PageRevision | null>(null);

  // Rollback confirmation
  const [revertingRevId, setRevertingRevId] = useState<string | null>(null);

  // REAL-TIME: Subscribe to revisions via onSnapshot
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPageRevisions(slug, revs => {
      setRevisions(revs);
      if (revs.length > 1) {
        setOldRevIndex(prev => (prev < revs.length ? prev : 1));
        setNewRevIndex(0);
      } else {
        setOldRevIndex(0);
        setNewRevIndex(0);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [slug]);

  // Compute diff between selected revisions
  const diffRows: DiffRow[] = useMemo(() => {
    if (revisions.length < 2) return [];
    const older = revisions[oldRevIndex];
    const newer = revisions[newRevIndex];
    if (!older || !newer) return [];
    return computeRevisionDiff(older.content, newer.content);
  }, [revisions, oldRevIndex, newRevIndex]);

  // Handle rollback / revert to a past revision
  const handleRollback = async (targetRev: PageRevision) => {
    if (currentUser.isAnonymous) {
      alert('Contribuições não são permitidas sem login. Por favor, autentique-se para reverter edições.');
      loginWithGoogle();
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja reverter a página para a revisão de ${formatDate(
          targetRev.timestamp
        )} por ${targetRev.author}?`
      )
    ) {
      return;
    }

    try {
      setRevertingRevId(targetRev.revId);
      await savePage({
        slug,
        title: page?.title || slug.replace(/_/g, ' '),
        content: targetRev.content,
        summary: `Reversão para a revisão ${targetRev.revId.slice(0, 8)} de ${targetRev.author}`,
        author: currentUser.username,
        authorId: currentUser.uid,
        minorEdit: false,
      });

      setViewingRev(null);
    } catch (err) {
      console.error('Error reverting revision:', err);
      alert('Erro ao reverter revisão: ' + String(err));
    } finally {
      setRevertingRevId(null);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        Sincronizando histórico de revisões em tempo real com o Firestore...
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span>
            Histórico de revisões de <span className="font-bold underline">{page?.title || slug.replace(/_/g, ' ')}</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado em tempo real
            </span>
            <button
              type="button"
              onClick={onBackToArticle}
              className="text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao artigo</span>
            </button>
          </div>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          No WikiWazzimaGiygg, cada edição cria uma revisão imutável com carimbo de data/hora e identificador único de autor no Firestore.
        </div>
      </div>

      {/* Snapshot Preview Modal if viewing past revision */}
      {viewingRev && (
        <div className="mb-6 p-4 rounded border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200 dark:border-amber-800">
            <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Você está visualizando uma revisão antiga desta página ({formatDate(viewingRev.timestamp)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRollback(viewingRev)}
                disabled={revertingRevId === viewingRev.revId}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium shadow-2xs flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar esta versão</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingRev(null)}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                Fechar prévia
              </button>
            </div>
          </div>

          <div
            className="mw-body-content max-h-[350px] overflow-y-auto p-3 bg-white dark:bg-gray-900 rounded border border-amber-200 dark:border-amber-800"
            dangerouslySetInnerHTML={{
              __html: parseWikitext(viewingRev.content, existingPageSlugs).html,
            }}
          />
        </div>
      )}

      {/* Side-by-side Diff Section */}
      {revisions.length >= 2 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xs text-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-blue-600" />
              <span>
                Comparação: Revisão de {formatDate(revisions[oldRevIndex]?.timestamp)} vs Revisão de{' '}
                {formatDate(revisions[newRevIndex]?.timestamp)}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
              Linhas analisadas: {diffRows.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-300 dark:border-gray-700 rounded font-mono text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700 font-sans">
                  <th className="p-2 w-1/2 text-left text-red-700 dark:text-red-400 font-semibold border-r border-[#a2a9b1] dark:border-gray-700">
                    Versão Anterior ({revisions[oldRevIndex]?.author})
                  </th>
                  <th className="p-2 w-1/2 text-left text-emerald-700 dark:text-emerald-400 font-semibold">
                    Versão Mais Recente ({revisions[newRevIndex]?.author})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {diffRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                    <td
                      className={`p-1.5 align-top border-r border-gray-200 dark:border-gray-800 ${
                        row.type === 'deleted' || row.type === 'modified'
                          ? 'bg-[#ffeef0] dark:bg-red-950/40'
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
                          ? 'bg-[#e6ffed] dark:bg-emerald-950/40'
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
        </div>
      )}

      {/* Revisions Table */}
      <div className="border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden text-xs">
        <div className="p-2.5 bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
          <span>Selecione duas versões para comparar:</span>
          <span className="text-[11px] text-gray-500 font-normal">
            Total de {revisions.length} revisão(ões) registradas
          </span>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {revisions.map((rev, index) => {
            const isCurrent = index === 0;
            return (
              <li
                key={rev.revId}
                className="p-2.5 hover:bg-white dark:hover:bg-gray-800/60 flex flex-wrap items-center gap-2 sm:gap-3 transition-colors"
              >
                {/* Radio buttons for comparison */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="radio"
                    name="oldRev"
                    checked={oldRevIndex === index}
                    onChange={() => setOldRevIndex(index)}
                    title="Definir como versão antiga"
                    className="text-blue-600 cursor-pointer"
                  />
                  <input
                    type="radio"
                    name="newRev"
                    checked={newRevIndex === index}
                    onChange={() => setNewRevIndex(index)}
                    title="Definir como versão recente"
                    className="text-blue-600 cursor-pointer"
                  />
                </div>

                {/* Timestamp */}
                <button
                  type="button"
                  onClick={() => setViewingRev(rev)}
                  className="font-medium text-[#0645ad] dark:text-[#6ba4ff] hover:underline cursor-pointer"
                >
                  {formatDate(rev.timestamp)}
                </button>

                {isCurrent && (
                  <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded font-semibold text-[10px]">
                    atual
                  </span>
                )}

                {rev.minorEdit && (
                  <span
                    className="font-bold text-gray-500 text-[11px]"
                    title="Esta é uma edição menor"
                  >
                    m
                  </span>
                )}

                {/* Author */}
                <button
                  type="button"
                  onClick={() => navigateToPage(`Usuário:${rev.author}`)}
                  className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline font-medium cursor-pointer"
                >
                  {rev.author}
                </button>

                {/* Byte size */}
                <span className="text-gray-500 font-mono text-[11px]">
                  ({rev.byteSize} bytes)
                </span>

                {/* Summary */}
                <span className="text-gray-600 dark:text-gray-400 italic flex-1 truncate">
                  ({rev.summary || 'sem resumo'})
                </span>

                {/* Rollback button */}
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRollback(rev)}
                    disabled={revertingRevId === rev.revId}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-0.5 ml-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>desfazer</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
