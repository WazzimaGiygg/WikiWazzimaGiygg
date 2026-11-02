import React, { useState, useEffect } from 'react';
import { Clock, Filter, Eye, History, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { RecentChange } from '../types/wiki';
import { getRecentChangesList, subscribeToRecentChanges } from '../services/wikiService';

export const SpecialRecentChanges: React.FC = () => {
  const { navigateToPage } = useWiki();
  const [changes, setChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideMinor, setHideMinor] = useState(false);

  useEffect(() => {
    // Initial fetch
    getRecentChangesList(50).then(list => {
      setChanges(list);
      setLoading(false);
    });

    // Real-time listener
    const unsub = subscribeToRecentChanges(list => {
      setChanges(list);
    }, 50);

    return () => unsub();
  }, []);

  const filteredChanges = changes.filter(c => {
    if (hideMinor && c.minorEdit) return false;
    return true;
  });

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  const formatDateGroup = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  // Group by date
  const grouped = filteredChanges.reduce((acc, change) => {
    const groupKey = formatDateGroup(change.timestamp);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(change);
    return acc;
  }, {} as Record<string, RecentChange[]>);

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <span>Mudanças recentes</span>
          </span>
          <span className="text-xs font-mono font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Feed em tempo real do Firestore
          </span>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Acompanhe as modificações mais recentes feitas neste wiki.
        </div>
      </div>

      {/* Filter box */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={hideMinor}
              onChange={e => setHideMinor(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Ocultar edições menores (m)</span>
          </label>
        </div>

        <div className="text-[11px] text-gray-500">
          Mostrando {filteredChanges.length} alterações
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Sincronizando com Firestore...</span>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">
          Nenhuma alteração recente registrada no momento.
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-200 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
                {dateLabel}
              </h2>
              <ul className="space-y-1.5 font-sans">
                {items.map((item, idx) => {
                  const delta = item.newLen - item.oldLen;
                  const isPositive = delta > 0;
                  const isZero = delta === 0;

                  return (
                    <li
                      key={item.id || idx}
                      className="p-1.5 hover:bg-white dark:hover:bg-gray-800/60 rounded flex flex-wrap items-baseline gap-1.5 leading-normal"
                    >
                      {/* Diff and Hist links */}
                      <span className="text-gray-500">
                        (
                        <button
                          type="button"
                          onClick={() => navigateToPage(item.pageId, 'history')}
                          className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                        >
                          dif
                        </button>
                        {' | '}
                        <button
                          type="button"
                          onClick={() => navigateToPage(item.pageId, 'history')}
                          className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                        >
                          hist
                        </button>
                        )
                      </span>

                      {/* Flags */}
                      <span className="w-4 text-center font-bold text-gray-500">
                        {item.minorEdit ? 'm' : ''}
                      </span>

                      {/* Page Link */}
                      <button
                        type="button"
                        onClick={() => navigateToPage(item.pageId, 'view')}
                        className="font-semibold text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                      >
                        {item.pageTitle}
                      </button>

                      {/* Time */}
                      <span className="text-gray-500 font-mono text-[11px]">
                        {formatTime(item.timestamp)}
                      </span>

                      {/* Byte Delta */}
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isPositive
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isZero
                            ? 'text-gray-500'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        ({isPositive ? `+${delta}` : delta})
                      </span>

                      <span className="text-gray-400">. .</span>

                      {/* Author */}
                      <button
                        type="button"
                        onClick={() => navigateToPage(`Usuário:${item.author}`)}
                        className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline font-medium cursor-pointer"
                      >
                        {item.author}
                      </button>

                      {/* Summary */}
                      {item.summary && (
                        <span className="text-gray-500 dark:text-gray-400 italic">
                          ({item.summary})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
