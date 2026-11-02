import React from 'react';
import {
  Home,
  Clock,
  Shuffle,
  HelpCircle,
  FileText,
  GitBranch,
  Layers,
  Settings,
  Database,
  ExternalLink,
  Code2,
  Heart,
  Share2,
  List,
  Info,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { getRandomPageSlug } from '../utils/randomPage';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { currentSlug, navigateToPage, sidebarOpen, setSidebarOpen } = useWiki();

  const handleRandomPage = async () => {
    const slug = await getRandomPageSlug();
    navigateToPage(slug);
  };

  const navLinks = [
    { label: 'Página principal', slug: 'Página_principal', icon: Home },
    { label: 'Mudanças recentes', slug: 'Especial:Mudanças_recentes', icon: Clock },
    { label: 'Página aleatória', action: handleRandomPage, icon: Shuffle },
    { label: 'Ajuda de wikitexto', slug: 'Ajuda:Wikitexto', icon: HelpCircle },
    { label: 'Todas as páginas', slug: 'Especial:Todas_as_páginas', icon: List },
  ];

  const archLinks = [
    { label: 'Artigo MediaWiki', slug: 'MediaWiki', icon: FileText },
    { label: 'Arquitetura TS & NoSQL', slug: 'Arquitetura_MediaWiki_TS', icon: Layers },
    { label: 'Manual: LocalSettings.ts', slug: 'Manual:LocalSettings.ts', icon: Settings },
    { label: 'Wikimedia Foundation', slug: 'Wikimedia_Foundation', icon: Heart },
  ];

  const repoLinks = [
    { label: 'Informações do Repo', slug: 'Repositório_GitHub_Wikimedia', icon: GitBranch },
    { label: 'Sincronizar GitHub API', slug: 'Especial:GitHubSync', icon: Database },
  ];

  const toolLinks = [
    { label: 'Versão do Software', slug: 'Especial:Versão', icon: Info },
    { label: 'Configurações ($wg)', action: onOpenSettings, icon: Settings },
    { label: 'Versão para impressão', action: () => window.print(), icon: Share2 },
  ];

  return (
    <aside
      className={`fixed md:sticky top-13 left-0 z-30 h-[calc(100vh-3.25rem)] w-60 shrink-0 bg-[#f6f6f6] dark:bg-[#131722] border-r border-[#a2a9b1] dark:border-gray-800 transition-transform duration-200 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="p-4 space-y-5 text-xs">
        {/* MediaWiki Flower Logo */}
        <div className="text-center pb-3 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigateToPage('Página_principal')}
            className="inline-flex flex-col items-center group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-linear-to-tr from-[#3366cc] via-[#00a2ff] to-[#44cc66] flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform mb-1">
              <Code2 className="w-9 h-9 text-white stroke-[2.2]" />
            </div>
            <span className="font-serif font-bold text-base text-gray-900 dark:text-gray-100 tracking-tight">
              MediaWiki <span className="text-blue-600 dark:text-blue-400 font-sans text-xs">TS</span>
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Motor de Conhecimento Livre</span>
          </button>
        </div>

        {/* Section 1: Navegação */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            Navegação
          </h3>
          <ul className="space-y-0.5">
            {navLinks.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.slug && currentSlug === item.slug;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.slug) navigateToPage(item.slug);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                      isActive
                        ? 'bg-[#3366cc]/10 text-[#0645ad] dark:text-[#6ba4ff] font-semibold border-l-3 border-[#3366cc]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section 2: Arquitetura TS */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            Arquitetura TS
          </h3>
          <ul className="space-y-0.5">
            {archLinks.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentSlug === item.slug;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => navigateToPage(item.slug)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                      isActive
                        ? 'bg-[#3366cc]/10 text-[#0645ad] dark:text-[#6ba4ff] font-semibold border-l-3 border-[#3366cc]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section 3: Repositório GitHub Upstream */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            GitHub Upstream
          </h3>
          <ul className="space-y-0.5">
            {repoLinks.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentSlug === item.slug;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => navigateToPage(item.slug)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                      isActive
                        ? 'bg-[#3366cc]/10 text-[#0645ad] dark:text-[#6ba4ff] font-semibold border-l-3 border-[#3366cc]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <a
                href="https://github.com/wikimedia/mediawiki"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>wikimedia/mediawiki</span>
                </span>
                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.2 rounded font-mono">↗</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Section 4: Ferramentas */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            Ferramentas
          </h3>
          <ul className="space-y-0.5">
            {toolLinks.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.slug && currentSlug === item.slug;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.slug) navigateToPage(item.slug);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                      isActive
                        ? 'bg-[#3366cc]/10 text-[#0645ad] dark:text-[#6ba4ff] font-semibold border-l-3 border-[#3366cc]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* System badge info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-500 dark:text-gray-400 space-y-1 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Firestore Conectado</span>
          </div>
          <div>Versão 1.43.0-ts (PHP → TS)</div>
          <div>GNU GPL v2.0+</div>
        </div>
      </div>
    </aside>
  );
};
