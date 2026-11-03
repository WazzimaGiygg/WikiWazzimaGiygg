import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserX,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWiki } from '../../context/WikiContext';
import { CheckUserCase, CheckUserStatus, UserGroup } from '../../types/wiki';
import {
  subscribeToCheckUserCases,
  createCheckUserCase,
  updateCheckUserCase,
  saveUserRights,
} from '../../services/wikiService';

export const CheckUserPanel: React.FC = () => {
  const { currentUser, isBureaucrat, navigateToPage } = useWiki();

  const [cases, setCases] = useState<CheckUserCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Modal / Form state for new investigation
  const [showNewModal, setShowNewModal] = useState(false);
  const [suspectedMaster, setSuspectedMaster] = useState('');
  const [suspectedPuppetsInput, setSuspectedPuppetsInput] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Verdict state for active bureaucrat review
  const [editingVerdictCaseId, setEditingVerdictCaseId] = useState<string | null>(null);
  const [selectedVerdict, setSelectedVerdict] = useState<CheckUserStatus>('investigando');
  const [verdictNotes, setVerdictNotes] = useState('');
  const [savingVerdict, setSavingVerdict] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCheckUserCases(fetchedCases => {
      setCases(fetchedCases);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectedMaster.trim()) {
      setFormError('Informe a conta principal suspeita (mestre dos fantoches).');
      return;
    }
    const puppets = suspectedPuppetsInput
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (puppets.length === 0) {
      setFormError('Informe pelo menos uma conta fantoche suspeita.');
      return;
    }
    if (!evidence.trim()) {
      setFormError('Apresente os indícios, padrões comportamentais ou difs comprobatórios.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createCheckUserCase({
        suspectedMaster: suspectedMaster.trim(),
        suspectedPuppets: puppets,
        requestedBy: currentUser.username || 'Editor da Comunidade',
        requestedByUid: currentUser.uid || 'anonymous',
        evidence: evidence.trim(),
        reason: reason.trim() || 'Verificação de identidade e abuso de múltiplas contas',
        status: 'investigando',
      });

      setShowNewModal(false);
      setSuspectedMaster('');
      setSuspectedPuppetsInput('');
      setEvidence('');
      setReason('');
      setActionSuccess('Investigação de contas fantoche registrada com sucesso no Firestore.');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar caso no Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVerdict = async (caseItem: CheckUserCase) => {
    if (!verdictNotes.trim()) {
      alert('Por favor, informe a nota técnica ou parecer da verificação.');
      return;
    }
    setSavingVerdict(true);
    try {
      await updateCheckUserCase(caseItem.id, {
        status: selectedVerdict,
        verdictNotes: verdictNotes.trim(),
        verifiedBy: currentUser.username || 'Burocrata / Verificador',
      });
      setEditingVerdictCaseId(null);
      setVerdictNotes('');
      setActionSuccess(`Veredito atualizado para "${getStatusLabel(selectedVerdict)}" com sucesso!`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Erro ao atualizar veredito: ' + err.message);
    } finally {
      setSavingVerdict(false);
    }
  };

  // Block confirmed puppets directly
  const handleQuickBlockPuppet = async (puppetUsername: string) => {
    if (!confirm(`Deseja aplicar a restrição de bloqueio ao utilizador "${puppetUsername}" no Firestore?`)) {
      return;
    }
    try {
      await saveUserRights({
        bureaucrat: {
          uid: currentUser.uid || 'admin',
          username: currentUser.username || 'Burocrata Verificador',
        },
        targetUid: `user_${puppetUsername.toLowerCase().replace(/\s+/g, '_')}`,
        targetName: puppetUsername,
        newGroups: ['bloqueado'],
        previousGroups: [],
        reason: 'Uso abusivo de conta fantoche (Sockpuppet) confirmado em verificação formal de contas',
      });
      setActionSuccess(`Conta fantoche "${puppetUsername}" bloqueada com sucesso!`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Erro ao bloquear conta: ' + err.message);
    }
  };

  const getStatusBadge = (status: CheckUserStatus) => {
    switch (status) {
      case 'confirmado_fantoche':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
            <UserX className="w-3 h-3" />
            Fantoche Confirmado
          </span>
        );
      case 'investigando':
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Em Investigação
          </span>
        );
      case 'inocente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Inocente (Diferentes)
          </span>
        );
      case 'inconclusivo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700">
            <HelpCircle className="w-3 h-3" />
            Inconclusivo
          </span>
        );
      case 'encerrado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <ShieldCheck className="w-3 h-3" />
            Encerrado
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (s: CheckUserStatus) => {
    switch (s) {
      case 'confirmado_fantoche':
        return 'Fantoche Confirmado';
      case 'investigando':
      case 'aberto':
        return 'Em Investigação';
      case 'inocente':
        return 'Inocente';
      case 'inconclusivo':
        return 'Inconclusivo';
      case 'encerrado':
        return 'Encerrado';
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'todos' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMaster = c.suspectedMaster.toLowerCase().includes(q);
      const matchPuppets = c.suspectedPuppets.some(p => p.toLowerCase().includes(q));
      const matchReason = (c.reason || '').toLowerCase().includes(q);
      return matchMaster || matchPuppets || matchReason;
    }
    return true;
  });

  return (
    <div className="space-y-5 text-xs">
      {/* Intro Box */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 rounded space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
              Verificação de Contas (Fantoches / Sockpuppets)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPage('Wiki:Verificação_de_contas')}
              className="px-2.5 py-1 text-[11px] bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded text-purple-700 dark:text-purple-300 font-medium inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver Política Oficial</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Abrir Nova Investigação</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
          Esta ferramenta canônica permite investigar e registrar o uso indevido de múltiplas contas destinadas a forjar consenso artificial, violar sanções disciplinares ou praticar abusos de edição. Os dados e vereditos são auditados em tempo real no Firestore.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por suspeito mestre, conta fantoche ou motivo..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
          >
            <option value="todos">Todos os casos ({cases.length})</option>
            <option value="investigando">Em Investigação</option>
            <option value="confirmado_fantoche">Fantoche Confirmado</option>
            <option value="inocente">Inocente</option>
            <option value="inconclusivo">Inconclusivo</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-600" />
          <span>Carregando investigações do Firestore...</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Nenhuma investigação encontrada</p>
          <p className="text-[11px] mt-1">Não há registros correspondentes aos filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map(caseItem => {
            const isExpanded = expandedCaseId === caseItem.id;
            const isEditing = editingVerdictCaseId === caseItem.id;

            return (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded overflow-hidden shadow-2xs"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
                  className="p-3 bg-[#f8f9fa] dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-[#a2a9b1]/60 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                    {getStatusBadge(caseItem.status)}
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {caseItem.suspectedMaster}
                    </span>
                    <span className="text-gray-400">vs.</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300">
                      {caseItem.suspectedPuppets.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <span>Requerido por: <strong>{caseItem.requestedBy}</strong></span>
                    <span>{new Date(caseItem.timestamp).toLocaleDateString('pt-BR')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Body Details */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">Motivação da Suspeita:</span>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {caseItem.reason}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">Evidências e Difs Apresentados:</span>
                        <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-line font-mono text-[11px]">
                          {caseItem.evidence}
                        </div>
                      </div>
                    </div>

                    {/* Suspected Puppets List with Action Badges */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                      <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                        Contas Envolvidas na Análise:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Principal:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{caseItem.suspectedMaster}</span>
                        </div>
                        {caseItem.suspectedPuppets.map((puppet, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded flex items-center gap-2"
                          >
                            <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-300">Fantoche:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{puppet}</span>
                            {isBureaucrat && caseItem.status === 'confirmado_fantoche' && (
                              <button
                                type="button"
                                onClick={() => handleQuickBlockPuppet(puppet)}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                                title="Bloquear esta conta no Firestore"
                              >
                                Bloquear
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verdict Notes if already resolved */}
                    {caseItem.verdictNotes && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded space-y-1">
                        <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 font-bold">
                          <span>Parecer Oficial do Verificador:</span>
                          <span className="text-[11px] font-normal">Verificado por: {caseItem.verifiedBy || 'Burocrata'}</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-[11px] whitespace-pre-line">
                          {caseItem.verdictNotes}
                        </p>
                      </div>
                    )}

                    {/* Bureaucrat Action Panel */}
                    {isBureaucrat && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                        {isEditing ? (
                          <div className="w-full p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded space-y-3">
                            <h4 className="font-bold text-purple-900 dark:text-purple-200">
                              Emitir Parecer Técnico de Verificação
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <select
                                value={selectedVerdict}
                                onChange={e => setSelectedVerdict(e.target.value as CheckUserStatus)}
                                className="bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100"
                              >
                                <option value="investigando">Em Investigação</option>
                                <option value="confirmado_fantoche">Confirmado Fantoche (Positivo)</option>
                                <option value="inocente">Inocente (Negativo)</option>
                                <option value="inconclusivo">Inconclusivo</option>
                                <option value="encerrado">Encerrado</option>
                              </select>
                              <input
                                type="text"
                                value={verdictNotes}
                                onChange={e => setVerdictNotes(e.target.value)}
                                placeholder="Justificativa técnica, notas de IP/UID ou difs..."
                                className="md:col-span-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingVerdictCaseId(null)}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded font-medium"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={savingVerdict}
                                onClick={() => handleUpdateVerdict(caseItem)}
                                className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center gap-1.5"
                              >
                                {savingVerdict && <Clock className="w-3 h-3 animate-spin" />}
                                <span>Salvar Veredito no Firestore</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              Painel administrativo para Burocratas e Verificadores credenciados.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVerdictCaseId(caseItem.id);
                                setSelectedVerdict(caseItem.status);
                                setVerdictNotes(caseItem.verdictNotes || '');
                              }}
                              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded font-medium"
                            >
                              Atualizar Veredito / Status
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVA INVESTIGAÇÃO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-600" />
                <span>Abrir Pedido de Verificação de Contas</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Conta Principal Suspeita (Puppetmaster) *
                </label>
                <input
                  type="text"
                  required
                  value={suspectedMaster}
                  onChange={e => setSuspectedMaster(e.target.value)}
                  placeholder="Nome de usuário da conta de controle..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Contas Fantoche Suspeitas (separadas por vírgula ou linha) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={suspectedPuppetsInput}
                  onChange={e => setSuspectedPuppetsInput(e.target.value)}
                  placeholder="Exemplo: UsuarioTeste1, EditorSecundario_123, ContaB"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Evidências Técnicas e Comportamentais *
                </label>
                <textarea
                  rows={3}
                  required
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  placeholder="Difs de edição, horários coincidentes de atividade, padrões idênticos de formatação de wikitexto..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Justificativa / Motivação
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Guerra de edições em artigo protegido, manipulação de votação de eliminação..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center gap-1.5"
                >
                  {submitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submeter Investigação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
