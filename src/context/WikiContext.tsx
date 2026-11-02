import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { WikiSkin, WikiSettings, WikiUser } from '../types/wiki';
import {
  subscribeToAllPages,
  subscribeToWikiSettings,
  saveWikiSettingsToFirestore,
  seedInitialPagesIfNeeded,
} from '../services/wikiService';
import { slugify } from '../core/parser';

interface WikiContextType {
  currentUser: WikiUser;
  skin: WikiSkin;
  setSkin: (skin: WikiSkin) => void;
  currentSlug: string;
  setCurrentSlug: (slug: string) => void;
  activeTab: 'view' | 'edit' | 'history' | 'talk';
  setActiveTab: (tab: 'view' | 'edit' | 'history' | 'talk') => void;
  settings: WikiSettings;
  updateSettings: (newSettings: Partial<WikiSettings>) => Promise<void>;
  existingPageSlugs: Set<string>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setGuestNickname: (name: string) => void;
  navigateToPage: (target: string, tab?: 'view' | 'edit' | 'history' | 'talk') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isRealtimeConnected: boolean;
}

const DEFAULT_SETTINGS: WikiSettings = {
  sitename: 'WikiWazzimaGiygg',
  languageCode: 'pt-br',
  allowAnonymousEditing: true,
  enableLivePreview: true,
  defaultSkin: 'vector-modern',
  maxRecentChanges: 50,
  repositoryUrl: 'https://github.com/wikimedia/mediawiki',
};

const WikiContext = createContext<WikiContextType | null>(null);

export function WikiProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkin] = useState<WikiSkin>(() => {
    return (localStorage.getItem('mw_skin') as WikiSkin) || 'vector-modern';
  });

  const [currentSlug, setCurrentSlug] = useState<string>('Página_principal');
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'history' | 'talk'>('view');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [existingPageSlugs, setExistingPageSlugs] = useState<Set<string>>(new Set());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  const [settings, setSettings] = useState<WikiSettings>(() => {
    const saved = localStorage.getItem('mw_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.sitename === 'MediaWiki TS') {
        parsed.sitename = 'WikiWazzimaGiygg';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  });

  const [guestName, setGuestName] = useState<string>(() => {
    return localStorage.getItem('mw_guest_name') || `Colaborador_${Math.floor(100 + Math.random() * 900)}`;
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Sync hash routing e.g. #/wiki/MediaWiki or #/wiki/MediaWiki?action=edit
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/wiki/')) {
        const fullPath = hash.replace('#/wiki/', '');
        const [pageSlug, queryString] = fullPath.split('?');
        if (pageSlug) {
          setCurrentSlug(decodeURIComponent(pageSlug));
        }
        if (queryString) {
          const params = new URLSearchParams(queryString);
          const action = params.get('action');
          if (action === 'edit') setActiveTab('edit');
          else if (action === 'history') setActiveTab('history');
          else if (action === 'talk') setActiveTab('talk');
          else setActiveTab('view');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Seed pages then listen to all pages collection
  useEffect(() => {
    seedInitialPagesIfNeeded();

    const unsubPages = subscribeToAllPages(pages => {
      const slugSet = new Set<string>();
      pages.forEach(p => {
        slugSet.add(p.slug);
        slugSet.add(p.title);
        slugSet.add(slugify(p.title));
      });
      setExistingPageSlugs(slugSet);
      setIsRealtimeConnected(true);
    });

    const unsubSettings = subscribeToWikiSettings(remoteSettings => {
      if (remoteSettings && remoteSettings.sitename) {
        setSettings(prev => ({ ...prev, ...remoteSettings }));
        if (remoteSettings.defaultSkin) {
          setSkin(remoteSettings.defaultSkin);
        }
      }
    });

    return () => {
      unsubPages();
      unsubSettings();
    };
  }, []);

  // Persist skin
  const handleSetSkin = (newSkin: WikiSkin) => {
    setSkin(newSkin);
    localStorage.setItem('mw_skin', newSkin);
    if (newSkin === 'dark-mode') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (skin === 'dark-mode') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [skin]);

  const updateSettings = async (newSettings: Partial<WikiSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('mw_settings', JSON.stringify(updated));

    // Save to Firestore in real time for all clients
    try {
      await saveWikiSettingsToFirestore(updated);
    } catch (err) {
      console.warn('Failed to save settings to Firestore:', err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const setGuestNickname = (name: string) => {
    const clean = name.trim() || 'Colaborador_Anônimo';
    setGuestName(clean);
    localStorage.setItem('mw_guest_name', clean);
  };

  const navigateToPage = (target: string, tab: 'view' | 'edit' | 'history' | 'talk' = 'view') => {
    const slug = slugify(target);
    setCurrentSlug(slug);
    setActiveTab(tab);
    window.location.hash = `#/wiki/${encodeURIComponent(slug)}${tab !== 'view' ? `?action=${tab}` : ''}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentUser: WikiUser = firebaseUser
    ? {
        uid: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário MediaWiki',
        isAnonymous: false,
        avatarUrl: firebaseUser.photoURL || undefined,
        editCount: 1,
        joinedAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      }
    : {
        uid: `anon_${guestName}`,
        username: guestName,
        isAnonymous: true,
        editCount: 0,
        joinedAt: new Date().toISOString(),
      };

  return (
    <WikiContext.Provider
      value={{
        currentUser,
        skin,
        setSkin: handleSetSkin,
        currentSlug,
        setCurrentSlug,
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        existingPageSlugs,
        loginWithGoogle,
        logout,
        setGuestNickname,
        navigateToPage,
        sidebarOpen,
        setSidebarOpen,
        isRealtimeConnected,
      }}
    >
      {children}
    </WikiContext.Provider>
  );
}

export function useWiki() {
  const context = useContext(WikiContext);
  if (!context) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
}
