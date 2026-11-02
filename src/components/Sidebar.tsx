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
  const { currentSlug, navigateToPage, sidebarOpen, setSidebarOpen, settings } = useWiki();

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
    { label: 'Página Principal', slug: 'Página_principal', icon: FileText },
    { label: 'Arquitetura do Sistema', slug: 'Arquitetura_WikiWazzimaGiygg', icon: Layers },
    { label: 'Manual: LocalSettings.ts', slug: 'Manual:LocalSettings.ts', icon: Settings },
  ];

  const repoLinks = [
    { label: 'Sincronizar Repositório', slug: 'Especial:GitHubSync', icon: Database },
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
        {/* Brand Logo */}
        <div className="text-center pb-3 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigateToPage('Página_principal')}
            className="inline-flex flex-col items-center group cursor-pointer"
          >
            <div className="w-16 h-16 rounded bg-white dark:bg-black p-1 shadow-xs group-hover:scale-105 transition-transform mb-2 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
              <img
                src="/assets/aistudio/image_19fe7a14.png"
                alt="Logo WikiWazzimaGiygg"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-serif font-bold text-base text-gray-900 dark:text-gray-100 tracking-tight break-all">
              {settings.sitename}
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
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

        {/* Section 2: Arquitetura & Sistema */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            Estrutura do Wiki
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
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

        {/* Section 3: Sincronização */}
        <div>
          <h3 className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2 px-2">
            Sincronização
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
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
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
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
          <div>WikiWazzimaGiygg TS</div>
          <div>GNU GPL v2.0+</div>
        </div>
      </div>
    </aside>
  );
};
