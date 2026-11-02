import React, { useState, useEffect } from 'react';
import { List, Search, Plus, BookOpen, Tag, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiPage } from '../types/wiki';
import { subscribeToAllPages } from '../services/wikiService';

export const SpecialAllPages: React.FC = () => {
  const { navigateToPage } = useWiki();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [filterText, setFilterText] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  // REAL-TIME: Subscribe to all pages in Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllPages(list => {
      setPages(list);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const namespaces = [
    { id: 'all', label: '(Todos os espaços nominais)' },
    { id: 'Main', label: 'Principal' },
    { id: 'Help', label: 'Ajuda' },
    { id: 'Manual', label: 'Manual' },
    { id: 'Special', label: 'Especial' },
  ];

  const filtered = pages.filter(p => {
    if (selectedNamespace !== 'all' && p.namespace !== selectedNamespace) return false;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    navigateToPage(newPageTitle.trim(), 'edit');
  };

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <List className="w-6 h-6 text-blue-600" />
            <span>Todas as páginas</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado em tempo real
            </span>
            <span className="text-xs font-mono text-gray-500 font-normal">
              {pages.length} páginas registradas
            </span>
          </div>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Índice alfabético completo de todos os artigos do MediaWiki TS conectado reativamente ao Firestore.
        </div>
      </div>

      {/* Filter and Create form */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Espaço nominal:</label>
            <select
              value={selectedNamespace}
              onChange={e => setSelectedNamespace(e.target.value)}
              className="p-1.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-gray-100"
            >
              {namespaces.map(ns => (
                <option key={ns.id} value={ns.id}>
                  {ns.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Filtrar páginas por título..."
              className="w-full p-1.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Quick create page */}
        <form
          onSubmit={handleCreateNew}
          className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
        >
          <span className="text-gray-600 dark:text-gray-400 font-semibold shrink-0">Criar nova página:</span>
          <input
            type="text"
            value={newPageTitle}
            onChange={e => setNewPageTitle(e.target.value)}
            placeholder="Nome do novo artigo (ex: Algoritmo_de_Myers)"
            className="flex-1 p-1.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Sincronizando índice de páginas do Firestore...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">
          Nenhuma página encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(page => (
            <div
              key={page.slug}
              className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-400 rounded transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => navigateToPage(page.slug, 'view')}
                  className="font-semibold text-sm text-[#0645ad] dark:text-[#6ba4ff] hover:underline text-left group-hover:text-blue-700 flex items-start gap-1.5 mb-1 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>{page.title}</span>
                </button>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                  {page.summary || 'Página do wiki'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 flex items-center justify-between">
                <span>{page.revisionCount || 1} revisão(ões)</span>
                <span className="font-mono">{page.namespace}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
