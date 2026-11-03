import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  History,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Filter,
  Users,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import {
  UserGroup,
  UserRightsRecord,
  BureaucratLogEntry,
  WikiUser,
  WikiPage,
  PageProtectionLogEntry,
} from '../types/wiki';
import {
  saveUserRights,
  subscribeToAllUserRights,
  subscribeToBureaucratLogs,
  subscribeToProtectedPages,
  subscribeToPageProtectionLogs,
  getAllPagesList,
  DEFAULT_SUPER_ADMIN_EMAIL,
} from '../services/wikiService';
import { PageProtectionModal } from './PageProtectionModal';

interface GroupDefinition {
  id: UserGroup;
  name: string;
  badgeClass: string;
  description: string;
  powers: string[];
}

const AVAILABLE_GROUPS: GroupDefinition[] = [
  {
    id: 'burocrata',
    name: 'Burocrata',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    description: 'Nível supremo de administração comunitária. Pode atribuir e revogar privilégios de todos os utilizadores, incluindo administradores, burocratas e robôs.',
    powers: ['Gerenciar direitos de usuários (Special:UserRights)', 'Conceder/revogar status de Sysop e Burocrata', 'Supervisão de auditorias'],
  },
  {
    id: 'administrador',
    name: 'Administrador (Sysop)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    description: 'Gestor operacional da wiki. Tem capacidade de bloquear editores nocivos, proteger páginas contra vandalismo e apagar artigos em desacordo.',
    powers: ['Bloquear usuários infratores', 'Proteger e desproteger páginas', 'Eliminar revisões e páginas'],
  },
  {
    id: 'eliminador',
    name: 'Eliminador',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    description: 'Direito técnico voltado a fechar páginas para eliminação rápida e votações concluídas na comunidade.',
    powers: ['Eliminar artigos propostos', 'Restaurar páginas apagadas por engano'],
  },
  {
    id: 'reversor',
    name: 'Reversor (Rollbacker)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Ferramenta de combate ágil ao vandalismo. Permite reverter em um único clique sequências de edições de um mesmo colaborador.',
    powers: ['Reversão instantânea de edições consecutivas', 'Marcação de sumários padronizados'],
  },
  {
    id: 'autorrevisor',
    name: 'Autorrevisor',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    description: 'Editor experiente e com histórico confiável. Suas contribuições são automaticamente marcadas como patrulhadas nas Mudanças Recentes.',
    powers: ['Edições patrulhadas automaticamente', 'Não polui filas de revisão'],
  },
  {
    id: 'bot',
    name: 'Robô (Bot)',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    description: 'Conta automatizada controlada por scripts ou agentes de sincronização. Suas edições não sobrecarregam o feed padrão.',
    powers: ['Ocultação padrão nas Mudanças Recentes', 'Operações em lote de alta frequência'],
  },
  {
    id: 'confirmado',
    name: 'Usuário confirmado',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    description: 'Conta verificada com permissão irrestrita para criar novos artigos e editar páginas sem restrição temporária.',
    powers: ['Criação ilimitada de páginas', 'Edição de páginas semi-protegidas'],
  },
  {
    id: 'bloqueado',
    name: 'Bloqueado (Restrito)',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    description: 'Usuário suspenso pela administração por infração de políticas ou vandalismo recorrente. Impedido de salvar alterações.',
    powers: ['Impedimento de salvar edições', 'Impedimento de criar tópicos em discussões'],
  },
];

export const SpecialBureaucratAdmin: React.FC = () => {
  const { currentUser, isBureaucrat, loginWithGoogle, navigateToPage } = useWiki();

  // Active view tab in Bureaucrat portal
  const [activeTab, setActiveTab] = useState<'manage' | 'protected_pages' | 'logs' | 'users'>('manage');

  // Search & Selected user state
  const [searchTarget, setSearchTarget] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<{
    uid: string;
    username: string;
    email?: string;
    groups: UserGroup[];
  } | null>(null);

  // Form states
  const [selectedGroups, setSelectedGroups] = useState<Set<UserGroup>>(new Set());
  const [reason, setReason] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('Indefinido');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Demo override state for reviewers who want to test the full UI without logging in as the main email
  const [demoBureaucratMode, setDemoBureaucratMode] = useState(false);

  // Real-time lists from Firestore
  const [allRights, setAllRights] = useState<UserRightsRecord[]>([]);
  const [logs, setLogs] = useState<BureaucratLogEntry[]>([]);
  const [knownUsers, setKnownUsers] = useState<Array<{ uid: string; username: string; email?: string }>>([]);
  const [protectedPages, setProtectedPages] = useState<WikiPage[]>([]);
  const [protectionLogs, setProtectionLogs] = useState<PageProtectionLogEntry[]>([]);
  const [allPages, setAllPages] = useState<WikiPage[]>([]);
  const [selectedPageForProtection, setSelectedPageForProtection] = useState<WikiPage | null>(null);
  const [pageToProtectQuery, setPageToProtectQuery] = useState<string>('');

  // Check effectively if user has bureaucrat rights
  const hasBureaucratAccess = isBureaucrat || demoBureaucratMode;

  // Real-time subscriptions to Firestore
  useEffect(() => {
    const unsubRights = subscribeToAllUserRights(records => {
      setAllRights(records);
    });

    const unsubLogs = subscribeToBureaucratLogs(entries => {
      setLogs(entries);
    });

    const unsubProtectedPages = subscribeToProtectedPages(pages => {
      setProtectedPages(pages);
    });

    const unsubProtectionLogs = subscribeToPageProtectionLogs(entries => {
      setProtectionLogs(entries);
    });

    // Populate all pages and known users
    getAllPagesList().then(pages => {
      setAllPages(pages);
      const userMap = new Map<string, { uid: string; username: string; email?: string }>();

      // Known admin
      userMap.set('admin_default', {
        uid: 'bureaucrat_owner',
        username: 'Burocrata Fundador',
        email: DEFAULT_SUPER_ADMIN_EMAIL,
      });

      // From page authors
      pages.forEach(p => {
        if (p.authorId && p.author) {
          userMap.set(p.authorId, {
            uid: p.authorId,
            username: p.author,
          });
        }
      });

      setKnownUsers(Array.from(userMap.values()));
    });

    return () => {
      unsubRights();
      unsubLogs();
      unsubProtectedPages();
      unsubProtectionLogs();
    };
  }, []);

  // When a user is selected, sync group checkboxes
  const handleSelectUser = (user: { uid: string; username: string; email?: string; groups?: UserGroup[] }) => {
    // Check if we have an existing rights record in Firestore
    const existing = allRights.find(r => r.uid === user.uid);
    const initialGroups = existing ? existing.groups : (user.groups || ['confirmado']);

    setSelectedUser({
      uid: user.uid,
      username: user.username,
      email: user.email || existing?.email,
      groups: initialGroups,
    });
    setSelectedGroups(new Set(initialGroups));
    setSaveSuccess(null);
    setSaveError(null);
    setReason('');
  };

  // Toggle group checkbox
  const handleToggleGroup = (groupId: UserGroup) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Submit rights update to Firestore
  const handleSaveRights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!reason.trim()) {
      setSaveError('Por favor, informe a justificativa (motivo) para o registo de auditoria.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const actingBureaucrat = {
      uid: currentUser.uid || 'bureaucrat_session',
      username: currentUser.username || 'Burocrata do Sistema',
    };

    const newGroupsList = Array.from(selectedGroups);

    try {
      await saveUserRights({
        bureaucrat: actingBureaucrat,
        targetUid: selectedUser.uid,
        targetName: selectedUser.username,
        targetEmail: selectedUser.email,
        newGroups: newGroupsList,
        previousGroups: selectedUser.groups,
        reason: reason.trim(),
        expiry,
      });

      setSelectedUser({
        ...selectedUser,
        groups: newGroupsList,
      });

      setSaveSuccess(`Os direitos de "${selectedUser.username}" foram atualizados com sucesso no Firestore!`);
      setReason('');
    } catch (err: any) {
      console.error('Erro ao salvar direitos de usuário:', err);
      setSaveError(err?.message || 'Falha ao salvar privilégios no Firestore.');
    } finally {
      setSaving(false);
    }
  };

  // Quick lookup user by search input
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTarget.trim().toLowerCase();
    if (!query) return;

    // Check in existing records first
    const foundRecord = allRights.find(
      r => r.username.toLowerCase().includes(query) || r.uid.toLowerCase() === query || (r.email && r.email.toLowerCase().includes(query))
    );

    if (foundRecord) {
      handleSelectUser(foundRecord);
      return;
    }

    // Check in known users
    const foundKnown = knownUsers.find(
      u => u.username.toLowerCase().includes(query) || u.uid.toLowerCase() === query || (u.email && u.email.toLowerCase().includes(query))
    );

    if (foundKnown) {
      handleSelectUser(foundKnown);
      return;
    }

    // If not found, create a new target entry for arbitrary username/UID
    handleSelectUser({
      uid: searchTarget.includes('@') ? `user_${searchTarget.split('@')[0]}` : `user_${searchTarget.trim()}`,
      username: searchTarget.trim(),
      groups: ['confirmado'],
    });
  };

  return (
    <div className="py-2">
      {/* Title Header */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>Administração de privilégios de usuário</span>
          </h1>

          <div className="flex items-center gap-2 text-xs">
            {hasBureaucratAccess ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Burocrata Ativo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Acesso Restrito</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center justify-between gap-2">
          <span>
            Ferramenta canônica da Wikipédia para Burocratas (<code>Special:UserRights</code>) gerenciarem grupos de permissão no Firestore.
          </span>
          <span className="font-mono text-purple-700 dark:text-purple-300">
            Especial:Permissões_de_usuário
          </span>
        </div>
      </div>

      {/* Access Control Notice */}
      {!hasBureaucratAccess && (
        <div className="mb-6 p-4 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">Permissão de Burocrata Necessária</div>
              <p className="leading-relaxed">
                A ação solicitada nesta página administrativa está limitada a utilizadores pertencentes ao grupo <strong>Burocratas</strong> da Wikipédia.
                O burocrata fundador registrado é <code>{DEFAULT_SUPER_ADMIN_EMAIL}</code>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-200 dark:border-amber-900/60">
            {currentUser.isAnonymous ? (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="px-3 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium shadow-2xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Iniciar sessão com Conta Google de Burocrata</span>
              </button>
            ) : (
              <div className="text-[11px] text-gray-600 dark:text-gray-400">
                Conectado como: <strong>{currentUser.username}</strong> ({currentUser.email || 'sem e-mail'})
              </div>
            )}

            <button
              type="button"
              onClick={() => setDemoBureaucratMode(true)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium shadow-2xs flex items-center gap-1.5 ml-auto"
              title="Ativar privilégios de teste no navegador"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Habilitar Modo Burocrata para Testes</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-[#a2a9b1] dark:border-gray-700 mb-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'manage'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Atribuir e Gerenciar Direitos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('protected_pages')}
          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'protected_pages'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Páginas Protegidas ({protectedPages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Registo de privilégios ({logs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400 font-semibold bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Diretório de Grupos ({allRights.length})</span>
        </button>
      </div>

      {/* TAB 1: MANAGE USER RIGHTS */}
      {activeTab === 'manage' && (
        <div className="space-y-6 text-xs">
          {/* Lookup User Box */}
          <div className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs space-y-3">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-600" />
              <span>Selecionar utilizador para modificação de direitos</span>
            </h2>

            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchTarget}
                  onChange={e => setSearchTarget(e.target.value)}
                  placeholder="Nome de utilizador, Google UID ou e-mail..."
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-purple-600"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium shadow-2xs cursor-pointer"
              >
                Carregar utilizador
              </button>
            </form>

            {/* Quick buttons from known users */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-gray-500 font-semibold">Atalhos rápidos:</span>
              {knownUsers.slice(0, 6).map(u => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    selectedUser?.uid === u.uid
                      ? 'bg-purple-600 text-white border-purple-700 font-semibold'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>

          {/* User Form */}
          {selectedUser ? (
            <form onSubmit={handleSaveRights} className="space-y-4">
              {/* Selected User Header Card */}
              <div className="p-4 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-900/60 rounded shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                      Utilizador Selecionado
                    </span>
                    <h3 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>{selectedUser.username}</span>
                      <button
                        type="button"
                        onClick={() => navigateToPage(`Usuário:${selectedUser.username}`)}
                        className="text-xs text-blue-600 hover:underline font-normal font-sans"
                      >
                        (Ver página de utilizador)
                      </button>
                    </h3>
                  </div>

                  <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700">
                    UID: {selectedUser.uid}
                  </div>
                </div>

                {/* Current Groups Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-gray-500 font-medium">Grupos atuais no Firestore:</span>
                  {selectedUser.groups.length > 0 ? (
                    selectedUser.groups.map(g => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                      >
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">Nenhum grupo especial atribuído</span>
                  )}
                </div>
              </div>

              {/* Group Checkboxes Grid */}
              <div className="border border-[#a2a9b1] dark:border-gray-700 rounded overflow-hidden">
                <div className="bg-[#eaecf0] dark:bg-gray-800 px-3 py-2 border-b border-[#a2a9b1] dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                  <span>Grupos disponíveis para adição / remoção</span>
                  <span className="text-[11px] text-gray-500">
                    {selectedGroups.size} de {AVAILABLE_GROUPS.length} selecionados
                  </span>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {AVAILABLE_GROUPS.map(group => {
                    const isChecked = selectedGroups.has(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-purple-50/60 dark:bg-purple-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleGroup(group.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {group.name}
                            </span>
                            <span className={`px-2 py-0.2 rounded border text-[10px] font-mono font-medium ${group.badgeClass}`}>
                              {group.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400">
                            {group.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {group.powers.map((pow, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1"
                              >
                                <ChevronRight className="w-2.5 h-2.5 text-purple-500" />
                                {pow}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Justification / Reason & Expiry fields */}
              <div className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block font-semibold text-gray-800 dark:text-gray-200">
                      Motivo da alteração de direitos <span className="text-red-600">*</span>:
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Ex: Pedido de ferramentas de administrador aprovado em votação pela comunidade"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-purple-600"
                      required
                    />
                    <div className="text-[10px] text-gray-500">
                      Este motivo será registrado de forma imutável no <em>Registo de privilégios de usuário</em>.
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-gray-800 dark:text-gray-200">
                      Tempo de validade:
                    </label>
                    <select
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-purple-600"
                    >
                      <option value="Indefinido">Indefinido (Permanente)</option>
                      <option value="1 dia">1 dia</option>
                      <option value="3 dias">3 dias</option>
                      <option value="1 semana">1 semana</option>
                      <option value="1 mês">1 mês</option>
                      <option value="6 meses">6 meses</option>
                      <option value="1 ano">1 ano</option>
                    </select>
                  </div>
                </div>

                {/* Feedback notifications */}
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Burocrata executor: <strong>{currentUser.username}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded font-medium shadow-2xs flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gravando no Firestore...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Gravar direitos de utilizador</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded">
              <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p>Pesquise ou selecione um utilizador acima para inspecionar e alterar seus grupos de privilégio.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOG (REGISTO DE PRIVILÉGIOS) */}
      {activeTab === 'logs' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <span>Registo de privilégios de utilizador (Bureaucrat Log)</span>
            </h2>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronização em tempo real
            </span>
          </div>

          <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
            {logs.length > 0 ? (
              <table className="wikitable w-full text-left">
                <thead>
                  <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700 text-[11px]">
                    <th className="p-2.5 font-semibold">Data e hora</th>
                    <th className="p-2.5 font-semibold">Burocrata</th>
                    <th className="p-2.5 font-semibold">Utilizador afetado</th>
                    <th className="p-2.5 font-semibold">Alterações de grupos</th>
                    <th className="p-2.5 font-semibold">Validade</th>
                    <th className="p-2.5 font-semibold">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-[11px]">
                  {logs.map((entry, idx) => {
                    const formattedDate = new Date(entry.timestamp).toLocaleString('pt-BR');
                    return (
                      <tr key={entry.id || idx} className="hover:bg-white dark:hover:bg-gray-800/50">
                        <td className="p-2.5 font-mono text-gray-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="p-2.5 font-medium">
                          <button
                            type="button"
                            onClick={() => navigateToPage(`Usuário:${entry.bureaucratName}`)}
                            className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                          >
                            {entry.bureaucratName}
                          </button>
                        </td>
                        <td className="p-2.5 font-medium">
                          <button
                            type="button"
                            onClick={() => navigateToPage(`Usuário:${entry.targetName}`)}
                            className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                          >
                            {entry.targetName}
                          </button>
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {entry.addedGroups.map(g => (
                              <span
                                key={g}
                                className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px]"
                              >
                                +{g}
                              </span>
                            ))}
                            {entry.removedGroups.map(g => (
                              <span
                                key={g}
                                className="px-1.5 py-0.2 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-mono text-[10px]"
                              >
                                -{g}
                              </span>
                            ))}
                            {entry.addedGroups.length === 0 && entry.removedGroups.length === 0 && (
                              <span className="text-gray-400 italic">Grupos inalterados</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {entry.expiry}
                        </td>
                        <td className="p-2.5 italic text-gray-700 dark:text-gray-300 max-w-xs break-words">
                          {entry.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhum registro de auditoria burocrática foi realizado ainda neste wiki.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES DIRECTORY (ESPECIAL:LISTA DE USUÁRIOS) */}
      {activeTab === 'users' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Diretório de utilizadores com direitos especiais</span>
            </h2>
            <div className="text-[11px] text-gray-500">
              Total registrado no Firestore: {allRights.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allRights.map(record => (
              <div
                key={record.uid}
                className="p-3 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigateToPage(`Usuário:${record.username}`)}
                    className="font-bold text-sm text-[#0645ad] dark:text-[#6ba4ff] hover:underline"
                  >
                    {record.username}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectUser(record);
                      setActiveTab('manage');
                    }}
                    className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100 text-[11px] font-medium"
                  >
                    Gerenciar direitos
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {record.groups.map(g => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <div className="pt-1 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>Atualizado por: {record.updatedBy || 'Burocrata'}</span>
                  <span>{new Date(record.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROTECTED PAGES MANAGEMENT */}
      {activeTab === 'protected_pages' && (
        <div className="space-y-6 text-xs">
          {/* Quick Page Protection Selector */}
          <div className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs space-y-3">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Proteger uma página do wiki</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-[11px]">
              Selecione qualquer página do wiki para definir níveis de proteção (bloqueada, semiprotegida ou desprotegida).
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Buscar página por título ou slug..."
                  value={pageToProtectQuery}
                  onChange={e => setPageToProtectQuery(e.target.value)}
                  className="w-full p-2 border border-[#a2a9b1] dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <select
                onChange={e => {
                  const targetSlug = e.target.value;
                  const found = allPages.find(p => p.slug === targetSlug);
                  if (found) setSelectedPageForProtection(found);
                }}
                defaultValue=""
                className="p-2 border border-[#a2a9b1] dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>
                  Ou escolha na lista de páginas ({allPages.length})
                </option>
                {allPages.map(p => (
                  <option key={p.slug} value={p.slug}>
                    {p.title} ({p.slug})
                  </option>
                ))}
              </select>

              {pageToProtectQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const q = pageToProtectQuery.trim().toLowerCase();
                    const found = allPages.find(
                      p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
                    );
                    if (found) {
                      setSelectedPageForProtection(found);
                    } else {
                      alert(`Página "${pageToProtectQuery}" não encontrada no Firestore.`);
                    }
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium cursor-pointer"
                >
                  Abrir proteção da página
                </button>
              )}
            </div>
          </div>

          {/* Currently Protected Pages Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>Páginas Atualmente Protegidas no Firestore ({protectedPages.length})</span>
              </h2>
              <span className="text-[11px] text-gray-500">
                Sincronizadas em tempo real via Firestore
              </span>
            </div>

            {protectedPages.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded">
                Nenhuma página com proteção ativa encontrada no banco de dados.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
                <table className="wikitable w-full text-left">
                  <thead>
                    <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
                      <th className="p-2.5 font-semibold">Página</th>
                      <th className="p-2.5 font-semibold">Nível de Proteção</th>
                      <th className="p-2.5 font-semibold">Motivo</th>
                      <th className="p-2.5 font-semibold">Definida por</th>
                      <th className="p-2.5 font-semibold">Expiração</th>
                      <th className="p-2.5 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {protectedPages.map(page => {
                      const level = page.protectionLevel || (page.isLocked ? 'locked' : 'unprotected');
                      return (
                        <tr key={page.slug} className="hover:bg-white dark:hover:bg-gray-800/40">
                          <td className="p-2.5 font-medium">
                            <button
                              type="button"
                              onClick={() => navigateToPage(page.slug)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-left cursor-pointer flex items-center gap-1"
                            >
                              <span>{page.title}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            </button>
                            <span className="text-[10px] text-gray-500 font-mono block">
                              {page.slug}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {level === 'locked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                                <Lock className="w-3 h-3 text-red-600" />
                                <span>Bloqueada (Total)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                <span>Semiprotegida</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-gray-700 dark:text-gray-300 text-[11px] max-w-xs">
                            {page.protectionReason || 'Sem motivo registrado'}
                          </td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-400 text-[11px]">
                            {page.protectedBy || 'Administrador'}
                          </td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-400 text-[11px]">
                            {page.protectionExpiry && page.protectionExpiry !== 'infinity'
                              ? new Date(page.protectionExpiry).toLocaleDateString('pt-BR')
                              : 'Permanente'}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPageForProtection(page)}
                              className="px-2.5 py-1 text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded hover:bg-purple-100 font-medium cursor-pointer"
                            >
                              Alterar nível
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Protection Audit Logs Table */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600" />
                <span>Registo de Auditoria de Proteções ({protectionLogs.length})</span>
              </h2>
            </div>

            {protectionLogs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs">
                Nenhum registo de proteção gravado no Firestore ainda.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
                <table className="wikitable w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
                      <th className="p-2 font-semibold">Data / Hora</th>
                      <th className="p-2 font-semibold">Página</th>
                      <th className="p-2 font-semibold">Ação</th>
                      <th className="p-2 font-semibold">Nível Anterior → Novo Nível</th>
                      <th className="p-2 font-semibold">Realizado por</th>
                      <th className="p-2 font-semibold">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {protectionLogs.map(log => (
                      <tr key={log.id || log.timestamp} className="hover:bg-white dark:hover:bg-gray-800/40">
                        <td className="p-2 text-gray-500 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-2 font-medium text-blue-600">
                          <button
                            type="button"
                            onClick={() => navigateToPage(log.pageSlug)}
                            className="hover:underline cursor-pointer"
                          >
                            {log.pageTitle}
                          </button>
                        </td>
                        <td className="p-2 uppercase font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              log.action === 'protect'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : log.action === 'unprotect'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px]">
                          <span>{log.previousLevel}</span>
                          <span className="mx-1 text-gray-400">→</span>
                          <span className="font-bold text-purple-600">{log.newLevel}</span>
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">
                          {log.performedBy}
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-400 text-[11px]">
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Protection Modal */}
      {selectedPageForProtection && (
        <PageProtectionModal
          page={selectedPageForProtection}
          isOpen={Boolean(selectedPageForProtection)}
          onClose={() => setSelectedPageForProtection(null)}
          onUpdated={() => {
            // Re-fetch all pages
            getAllPagesList().then(pages => setAllPages(pages));
          }}
        />
      )}
    </div>
  );
};
