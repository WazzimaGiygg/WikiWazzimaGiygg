import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  User as UserIcon,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Layout,
  Sliders,
  Menu,
  X,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Loader2,
  CornerDownLeft,
  Sparkles,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { subscribeToSearchPageTitles, subscribeToRecentPages, searchWikiPages } from '../services/wikiService';
import { WikiPage } from '../types/wiki';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    currentUser,
    loginWithGoogle,
    logout,
    skin,
    setSkin,
    navigateToPage,
    settings,
    setSidebarOpen,
  } = useWiki();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiPage[]>([]);
  const [recentPages, setRecentPages] = useState<WikiPage[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchCleanupRef = useRef<(() => void) | null>(null);
  const listItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Subscribe to recent Firestore pages when dropdown opens with empty query
  useEffect(() => {
    if (!showSearchDropdown || searchQuery.trim()) return;
    const unsubRecent = subscribeToRecentPages(pages => {
      setRecentPages(pages);
    }, 6);
    return () => unsubRecent();
  }, [showSearchDropdown, searchQuery]);

  // REAL-TIME FIRESTORE INDEX + COLLECTION SEARCH AS USER TYPES
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      if (searchCleanupRef.current) {
        searchCleanupRef.current();
        searchCleanupRef.current = null;
      }
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setShowSearchDropdown(true);
    setSelectedIndex(-1);

    if (searchCleanupRef.current) {
      searchCleanupRef.current();
      searchCleanupRef.current = null;
    }

    const timer = setTimeout(() => {
      const unsub = subscribeToSearchPageTitles(
        trimmed,
        results => {
          setSearchResults(results);
          setIsSearching(false);
        },
        8,
        () => {
          setSearchError('Não foi possível consultar o índice do Firestore.');
          setIsSearching(false);
        }
      );

      searchCleanupRef.current = unsub;
    }, 60);

    return () => {
      clearTimeout(timer);
      if (searchCleanupRef.current) {
        searchCleanupRef.current();
        searchCleanupRef.current = null;
      }
    };
  }, [searchQuery]);

  const activeItems = searchQuery.trim() ? searchResults : recentPages;

  // Keep keyboard-selected item visible inside scrollable listbox
  useEffect(() => {
    if (selectedIndex >= 0 && listItemRefs.current[selectedIndex]) {
      listItemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Global keyboard shortcut to focus search: press '/' (when not in an input/textarea)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const isEditable = (document.activeElement as HTMLElement | null)?.isContentEditable;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !isEditable) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setShowSearchDropdown(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectAndNavigate = (slug: string, tab: 'view' | 'edit' = 'view') => {
    navigateToPage(slug, tab);
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    if (!showSearchDropdown || activeItems.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < activeItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : activeItems.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && activeItems[selectedIndex]) {
      e.preventDefault();
      selectAndNavigate(activeItems[selectedIndex].slug);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setShowSearchDropdown(true);
      searchInputRef.current?.focus();
      return;
    }

    if (selectedIndex >= 0 && activeItems[selectedIndex]) {
      selectAndNavigate(activeItems[selectedIndex].slug);
      return;
    }

    if (searchResults.length > 0 && !isSearching) {
      selectAndNavigate(searchResults[0].slug);
      return;
    }

    // If user hit Enter before the debounced snapshot finished, query Firestore directly
    setIsSearching(true);
    try {
      const immediate = await searchWikiPages(trimmed);
      if (immediate.length > 0) {
        selectAndNavigate(immediate[0].slug);
      } else {
        selectAndNavigate(trimmed, 'edit');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const hasExactMatch =
    Boolean(searchQuery.trim()) &&
    searchResults.some(
      r => r.title.toLowerCase() === searchQuery.trim().toLowerCase() || r.slug.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#1a1f2c] border-b border-[#a2a9b1] dark:border-gray-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            title="Alternar barra lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => navigateToPage('Página_principal')}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <img
              src="/assets/aistudio/image_19fe7a14.png"
              alt="Logo WikiWazzimaGiygg"
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-700 bg-white shadow-2xs group-hover:scale-105 transition-transform object-contain p-0.5"
            />
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-lg text-gray-900 dark:text-gray-100 leading-none block">
                {settings.sitename}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans tracking-wide block mt-0.5">
                Motor de Conhecimento Livre
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search Bar with real-time Firestore results */}
        <div ref={searchRef} className="relative flex-1 max-w-lg mx-2">
          <form
            onSubmit={handleSearchSubmit}
            role="combobox"
            aria-expanded={showSearchDropdown}
            aria-haspopup="listbox"
            aria-controls="wiki-header-search-listbox"
            className="flex items-center bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded focus-within:border-[#3366cc] focus-within:ring-1 focus-within:ring-[#3366cc] transition-colors"
          >
            <div className="pl-2.5 pr-1.5 flex items-center pointer-events-none text-gray-400 shrink-0">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#3366cc]" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Pesquisar páginas no Firestore..."
              aria-label="Pesquisar páginas no Firestore"
              aria-autocomplete="list"
              aria-activedescendant={
                selectedIndex >= 0 && activeItems[selectedIndex]
                  ? `wiki-search-option-${selectedIndex}`
                  : undefined
              }
              className="w-full py-1.5 pr-2 text-xs sm:text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-hidden min-w-0"
            />

            <div className="flex items-center gap-1 pr-1 shrink-0">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedIndex(-1);
                    setShowSearchDropdown(true);
                    searchInputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded cursor-pointer"
                  title="Limpar pesquisa"
                  aria-label="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 select-none">
                  /
                </kbd>
              )}

              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-200/80 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-700 cursor-pointer transition-colors whitespace-nowrap"
              >
                Ir
              </button>
            </div>
          </form>

          {/* Real-Time Search Dropdown backed by Firestore */}
          {showSearchDropdown && (
            <div
              id="wiki-header-search-listbox"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xl overflow-hidden z-50"
            >
              {/* Header status bar */}
              <div className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {searchQuery.trim() ? 'Resultados do Firestore (tempo real)' : 'Navegação rápida · Páginas recentes'}
                </span>
                {isSearching ? (
                  <span className="flex items-center gap-1 text-[#0645ad] dark:text-[#6ba4ff] font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                  </span>
                ) : (
                  <span className="tabular-nums text-gray-500 dark:text-gray-400">
                    {activeItems.length} {activeItems.length === 1 ? 'página' : 'páginas'}
                  </span>
                )}
              </div>

              {searchError ? (
                <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40">
                  {searchError}
                </div>
              ) : activeItems.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800 text-xs max-h-80 overflow-y-auto">
                  {activeItems.map((result, idx) => {
                    const isSelected = selectedIndex === idx;
                    const nsLabel = getNamespaceLabel(result);
                    const previewText =
                      result.summary ||
                      (result.content ? result.content.substring(0, 95).replace(/[#*=[\]{}<>|]/g, '').trim() : 'Página do wiki');

                    return (
                      <li key={result.slug} role="option" id={`wiki-search-option-${idx}`} aria-selected={isSelected}>
                        <button
                          ref={el => {
                            listItemRefs.current[idx] = el;
                          }}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => selectAndNavigate(result.slug)}
                          className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0645ad] dark:text-[#6ba4ff]'
                              : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <BookOpen
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isSelected ? 'text-[#0645ad] dark:text-[#6ba4ff]' : 'text-gray-400'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-[13px] break-words">
                                  {highlightMatch(result.title, searchQuery)}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  · {nsLabel}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {previewText}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center text-gray-400 pt-1">
                            {isSelected ? (
                              <CornerDownLeft className="w-3.5 h-3.5 text-[#0645ad] dark:text-[#6ba4ff]" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}

                  {searchQuery.trim() && !hasExactMatch && (
                    <li className="p-2 bg-gray-50 dark:bg-gray-800/80 text-center border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => selectAndNavigate(searchQuery.trim(), 'edit')}
                        className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline text-xs inline-flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>Criar a página &quot;{searchQuery.trim()}&quot; neste wiki</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </li>
                  )}
                </ul>
              ) : !isSearching && searchQuery.trim() ? (
                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                  <p>
                    Nenhuma página no Firestore corresponde a &quot;<strong>{searchQuery.trim()}</strong>&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => selectAndNavigate(searchQuery.trim(), 'edit')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Criar &quot;{searchQuery.trim()}&quot; agora</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Carregando páginas recentes do Firestore...
                </div>
              )}

              {/* Keyboard hint footer */}
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span>Use ↑ ↓ para navegar e Enter para abrir</span>
                <span>Esc para fechar</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: User personal tools & skin controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Skin selector */}
          <div className="hidden md:flex items-center border border-gray-300 dark:border-gray-700 rounded p-0.5 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setSkin('vector-modern')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                skin === 'vector-modern'
                  ? 'bg-white dark:bg-gray-800 shadow-2xs font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Vector Moderno (2022)"
            >
              Vector 2022
            </button>
            <button
              type="button"
              onClick={() => setSkin('vector-legacy')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                skin === 'vector-legacy'
                  ? 'bg-white dark:bg-gray-800 shadow-2xs font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Vector Clássico (2010)"
            >
              Clássico
            </button>
            <button
              type="button"
              onClick={() => setSkin('dark-mode')}
              className={`p-1 text-[11px] rounded transition-colors ${
                skin === 'dark-mode'
                  ? 'bg-white dark:bg-gray-800 shadow-2xs font-semibold text-amber-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Modo Escuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick LocalSettings config button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Configurações da Wiki (LocalSettings.ts)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* User Profile / Auth */}
          <div className="relative">
            {currentUser.isAnonymous ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline font-mono text-[11px]">{currentUser.username}</span>
                </button>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium shadow-2xs"
                  title="Entrar com conta Google"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Entrar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {currentUser.isBureaucrat && (
                  <button
                    type="button"
                    onClick={() => navigateToPage('Especial:Permissões_de_usuário')}
                    className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-200 transition-colors"
                    title="Acessar painel de Burocrata (Special:UserRights)"
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>Burocrata</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span className="font-medium text-xs max-w-[120px] truncate">{currentUser.username}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* User Dropdown modal */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-lg p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {currentUser.isAnonymous ? 'Colaborador Anônimo' : 'Usuário Autenticado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2 space-y-2">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Nome de exibição nas edições:</label>
                    <div className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                      {currentUser.username}
                    </div>
                  </div>

                  {!currentUser.isAnonymous && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Espaço pessoal sincronizado</span>
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-300 font-mono truncate">
                        {currentUser.userPageTitle || `Usuário:${currentUser.username}`}
                      </div>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">
                        UID: {currentUser.uid}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    No WikiWazzimaGiygg, edições são associadas a este identificador com imutabilidade registrada no Firestore.
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const target = currentUser.userPageSlug || `Usuário:${currentUser.username}`;
                      navigateToPage(target);
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
                  >
                    <span>Página de usuário</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {currentUser.userPageSlug ? 'Ativa' : 'Abrir'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = currentUser.userTalkSlug || `Discussão_Usuário:${currentUser.username}`;
                      navigateToPage(target);
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
                  >
                    <span>Página de discussão</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {currentUser.userTalkSlug ? 'Ativa' : 'Abrir'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToPage('Especial:Mudanças_recentes');
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Suas contribuições
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToPage('Especial:Permissões_de_usuário');
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-between font-medium pt-1 border-t border-gray-100 dark:border-gray-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Permissões de utilizador</span>
                    </span>
                    <span className="text-[10px] text-purple-500 font-mono">Burocrata</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

function highlightMatch(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return <span>{text}</span>;

  const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normQuery = stripAccents(trimmed);
  if (!normQuery) return <span>{text}</span>;

  // Map normalized character indices back to original string indices
  const chars = Array.from(text);
  const normMap: number[] = [];
  let normStr = '';
  chars.forEach((ch, origIdx) => {
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (let i = 0; i < stripped.length; i++) {
      normStr += stripped[i];
      normMap.push(origIdx);
    }
  });

  const idx = normStr.indexOf(normQuery);
  if (idx === -1) return <span>{text}</span>;

  const startChar = normMap[idx];
  const endChar = normMap[idx + normQuery.length - 1] + 1;
  const before = chars.slice(0, startChar).join('');
  const match = chars.slice(startChar, endChar).join('');
  const after = chars.slice(endChar).join('');

  return (
    <span>
      {before}
      <span className="font-bold underline text-[#0645ad] dark:text-[#6ba4ff] bg-blue-100/80 dark:bg-blue-900/50 rounded-xs px-0.5">
        {match}
      </span>
      {after}
    </span>
  );
}

function getNamespaceLabel(page: WikiPage): string {
  const ns = page.namespace || 'Main';
  const mapping: Record<string, string> = {
    Main: 'Artigo',
    Help: 'Ajuda',
    File: 'Ficheiro',
    User: 'Usuário',
    Talk: 'Discussão',
    Special: 'Especial',
    Template: 'Predefinição',
    Category: 'Categoria',
    Manual: 'Manual',
  };
  return mapping[ns] || ns;
}
