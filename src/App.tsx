/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WikiProvider, useWiki } from './context/WikiContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ArticleView } from './components/ArticleView';
import { EditView } from './components/EditView';
import { HistoryView } from './components/HistoryView';
import { TalkView } from './components/TalkView';
import { SpecialRecentChanges } from './components/SpecialRecentChanges';
import { SpecialAllPages } from './components/SpecialAllPages';
import { SpecialVersion } from './components/SpecialVersion';
import { SpecialGitHubSync } from './components/SpecialGitHubSync';
import { LocalSettingsModal } from './components/LocalSettingsModal';
import { subscribeToPage } from './services/wikiService';
import { WikiPage } from './types/wiki';
import { Loader2 } from 'lucide-react';

function WikiMain() {
  const { currentSlug, activeTab, setActiveTab, skin, sidebarOpen, setSidebarOpen } = useWiki();

  const [currentPage, setCurrentPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editSection, setEditSection] = useState<number | undefined>(undefined);

  // REAL-TIME: Subscribe to current page changes via onSnapshot
  useEffect(() => {
    setLoading(true);

    const isSpecial = currentSlug.startsWith('Especial:') || currentSlug.startsWith('Special:');
    if (isSpecial) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPage(currentSlug, page => {
      setCurrentPage(page);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentSlug]);

  const isSpecialPage = currentSlug.startsWith('Especial:') || currentSlug.startsWith('Special:');

  const renderContent = () => {
    if (loading && !isSpecialPage) {
      return (
        <div className="py-24 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span>A sincronizar {currentSlug.replace(/_/g, ' ')} em tempo real com o Firestore...</span>
        </div>
      );
    }

    // Special pages routing
    if (currentSlug === 'Especial:Mudanças_recentes' || currentSlug === 'Special:RecentChanges') {
      return <SpecialRecentChanges />;
    }
    if (currentSlug === 'Especial:Todas_as_páginas' || currentSlug === 'Special:AllPages') {
      return <SpecialAllPages />;
    }
    if (currentSlug === 'Especial:Versão' || currentSlug === 'Special:Version') {
      return <SpecialVersion />;
    }
    if (currentSlug === 'Especial:GitHubSync' || currentSlug === 'Special:GitHubSync') {
      return <SpecialGitHubSync />;
    }

    // Standard wiki page tabs
    if (activeTab === 'edit') {
      return (
        <EditView
          page={currentPage}
          slug={currentSlug}
          initialSection={editSection}
          onSaved={saved => {
            setCurrentPage(saved);
            setActiveTab('view');
          }}
          onCancel={() => setActiveTab('view')}
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <HistoryView
          page={currentPage}
          slug={currentSlug}
          onBackToArticle={() => setActiveTab('view')}
        />
      );
    }

    if (activeTab === 'talk') {
      return (
        <TalkView
          page={currentPage}
          slug={currentSlug}
          onBackToArticle={() => setActiveTab('view')}
        />
      );
    }

    // Default: View mode
    return (
      <ArticleView
        page={currentPage}
        slug={currentSlug}
        onEdit={(section?: number) => {
          setEditSection(section);
          setActiveTab('edit');
        }}
        onViewHistory={() => setActiveTab('history')}
        onViewTalk={() => setActiveTab('talk')}
      />
    );
  };

  // Determine container styling based on selected skin
  const skinContainerClass =
    skin === 'vector-legacy'
      ? 'bg-[#f6f6f6] dark:bg-[#11141c]'
      : 'bg-white dark:bg-[#1a1f2c]';

  const contentBoxClass =
    skin === 'vector-legacy'
      ? 'bg-white dark:bg-[#1a1f2c] border-x border-b border-[#a2a9b1] dark:border-gray-800 px-6 py-4 shadow-xs min-h-[calc(100vh-8rem)]'
      : 'px-4 sm:px-8 py-4 max-w-5xl min-h-[calc(100vh-8rem)]';

  return (
    <div className={`min-h-screen text-gray-900 dark:text-gray-100 flex flex-col ${skinContainerClass}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Responsive backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

        <main className="flex-1 min-w-0 pb-16">
          <div className={contentBoxClass}>{renderContent()}</div>
        </main>
      </div>

      <LocalSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <WikiProvider>
      <WikiMain />
    </WikiProvider>
  );
}
