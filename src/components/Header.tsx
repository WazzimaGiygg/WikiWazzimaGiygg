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
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { searchWikiPages } from '../services/wikiService';
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState(currentUser.username);
  const [editingGuestName, setEditingGuestName] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Handle live search suggestions as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchWikiPages(searchQuery);
      setSearchResults(results.slice(0, 6));
      setShowSearchDropdown(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchResults.length > 0) {
      navigateToPage(searchResults[0].slug);
    } else {
      navigateToPage(searchQuery.trim(), 'edit');
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

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
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#3366cc] to-[#00a2ff] flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              W
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-lg text-gray-900 dark:text-gray-100 leading-none block">
                {settings.sitename}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans tracking-wide">
                  Tempo Real • Firestore
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Search Bar with Autocomplete */}
        <div ref={searchRef} className="relative flex-1 max-w-lg mx-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Pesquisar no MediaWiki TS..."
              className="w-full pl-8 pr-16 py-1.5 text-xs sm:text-sm bg-[#f8f9fa] dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]"
            />
            <button
              type="submit"
              className="absolute right-1 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"
            >
              Ir
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-lg overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {searchResults.map(result => (
                    <li key={result.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          navigateToPage(result.slug);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-start gap-2 text-gray-800 dark:text-gray-200"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{result.title}</div>
                          <div className="text-[11px] text-gray-500 truncate max-w-sm">{result.summary || 'Página do wiki'}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                  <li className="p-2 bg-gray-50 dark:bg-gray-800/80 text-center border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        navigateToPage(searchQuery.trim(), 'edit');
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline text-xs"
                    >
                      Criar a página &quot;{searchQuery}&quot; neste wiki →
                    </button>
                  </li>
                </ul>
              ) : (
                <div className="p-3 text-center text-xs text-gray-500">
                  <p>Nenhuma página encontrada com &quot;{searchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToPage(searchQuery.trim(), 'edit');
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="mt-1 inline-block text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Criar &quot;{searchQuery}&quot; agora?
                  </button>
                </div>
              )}
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
              <div className="flex items-center gap-2">
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

                  <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    No MediaWiki TS, edições são associadas a este identificador com imutabilidade registrada no Firestore.
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigateToPage(`Usuário:${currentUser.username}`);
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Página de usuário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToPage(`Discussão_Usuário:${currentUser.username}`);
                      setShowUserMenu(false);
                    }}
                    className="text-left py-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Página de discussão
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
