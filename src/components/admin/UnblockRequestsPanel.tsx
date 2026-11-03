import React, { useState, useEffect } from 'react';
import {
  Unlock,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  Plus,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useWiki } from '../../context/WikiContext';
import { UnblockRequest, UnblockStatus, UnblockVote } from '../../types/wiki';
import {
  subscribeToUnblockRequests,
  createUnblockRequest,
  voteOnUnblockRequest,
  resolveUnblockRequest,
} from '../../services/wikiService';

export const UnblockRequestsPanel: React.FC = () => {
  const { currentUser, isBureaucrat, navigateToPage } = useWiki();

  const [requests, setRequests] = useState<UnblockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Request Form
  const [showNewModal, setShowNewModal] = useState(false);
  const [targetUsername, setTargetUsername] = useState(currentUser.username || '');
  const [targetUid, setTargetUid] = useState(currentUser.uid || '');
  const [blockReason, setBlockReason] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Voting state
  const [votingOnId, setVotingOnId] = useState<string | null>(null);
  const [voteChoice, setVoteChoice] = useState<'desbloquear' | 'manter_bloqueio' | 'neutro'>('desbloquear');
  const [voteComment, setVoteComment] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);

  // Resolution state for Bureaucrats
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveVerdict, setResolveVerdict] = useState<UnblockStatus>('aprovado');
  const [verdictNotes, setVerdictNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUnblockRequests(fetchedRequests => {
      setRequests(fetchedRequests);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setFormError('Informe o nome de usuário que deseja recorrer.');
      return;
    }
    if (!appealReason.trim()) {
      setFormError('Informe a justificativa fundamentada e compromisso com o projeto.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createUnblockRequest({
        userName: targetUsername.trim(),
        userUid: targetUid.trim() || `user_${targetUsername.toLowerCase().replace(/\s+/g, '_')}`,
        blockReason: blockReason.trim() || 'Bloqueio administrativo por infração de políticas',
        appealReason: appealReason.trim(),
      });

      setShowNewModal(false);
      setBlockReason('');
      setAppealReason('');
      setFeedbackMsg('Pedido de discussão de desbloqueio protocolado com sucesso no Firestore.');
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao submeter pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCastVote = async (requestId: string) => {
    if (!voteComment.trim()) {
      alert('Por favor, informe a justificativa do seu voto.');
      return;
    }
    setSubmittingVote(true);
    try {
      const vote: UnblockVote = {
        user: currentUser.username || 'Colaborador',
        role: isBureaucrat ? 'Burocrata' : 'Editor',
        vote: voteChoice,
        comment: voteComment.trim(),
        timestamp: new Date().toISOString(),
      };
      await voteOnUnblockRequest(requestId, vote);
      setVotingOnId(null);
      setVoteComment('');
      setFeedbackMsg('Voto registrado com sucesso no Firestore.');
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert('Erro ao registrar voto: ' + err.message);
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleResolve = async (req: UnblockRequest) => {
    if (!verdictNotes.trim()) {
      alert('Por favor, forneça o parecer ou síntese de encerramento da discussão.');
      return;
    }
    setResolving(true);
    try {
      await resolveUnblockRequest(
        req.id,
        resolveVerdict,
        verdictNotes.trim(),
        currentUser.username || 'Burocrata'
      );
      setResolvingId(null);
      setVerdictNotes('');
      setFeedbackMsg(
        resolveVerdict === 'aprovado'
          ? `Desbloqueio de "${req.userName}" aprovado! O papel bloqueado foi revogado no Firestore.`
          : `Discussão encerrada. Bloqueio de "${req.userName}" mantido.`
      );
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      alert('Erro ao resolver pedido: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status: UnblockStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'em_discussao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <MessageSquare className="w-3 h-3" />
            Em Discussão Ativa
          </span>
        );
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Desbloqueio Aprovado
          </span>
        );
      case 'rejeitado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
            <XCircle className="w-3 h-3" />
            Bloqueio Mantido (Rejeitado)
          </span>
        );
      case 'encerrado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700">
            Encerrado
          </span>
        );
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'todos') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-5 text-xs">
      {/* Intro Box */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border border-blue-200 dark:border-blue-800/60 rounded space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
              Discussão de Desbloqueio e Apelações
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPage('Wiki:Discussão_de_bloqueio')}
              className="px-2.5 py-1 text-[11px] bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded text-blue-700 dark:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver Política</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Abrir Pedido de Desbloqueio</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
          Fórum comunitário para avaliar recursos de usuários que tiveram seus privilégios restringidos. A comunidade emite pareceres fundamentados e a burocracia executa a decisão final diretamente no Firestore.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded flex items-center justify-between gap-3">
        <span className="font-bold text-gray-700 dark:text-gray-300">
          Pedidos Registrados ({requests.length})
        </span>

        <div className="flex items-center gap-2">
          <label className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">Filtrar:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
          >
            <option value="todos">Todos os pedidos</option>
            <option value="pendente">Pendente</option>
            <option value="em_discussao">Em Discussão</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
          <span>Carregando discussões de desbloqueio...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-gray-500">
          <Unlock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Nenhum pedido de desbloqueio ativo</p>
          <p className="text-[11px] mt-1">Não há recursos pendentes no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const isExpanded = expandedId === req.id;
            const votes = req.votes || [];
            const unblockVotes = votes.filter(v => v.vote === 'desbloquear').length;
            const keepBlockVotes = votes.filter(v => v.vote === 'manter_bloqueio').length;
            const neutralVotes = votes.filter(v => v.vote === 'neutro').length;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded overflow-hidden shadow-2xs"
              >
                {/* Request Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="p-3 bg-[#f8f9fa] dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-[#a2a9b1]/60 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(req.status)}
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      Recurso de: {req.userName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <ThumbsUp className="w-3 h-3" /> {unblockVotes}
                      </span>
                      <span className="text-red-700 dark:text-red-400 font-semibold flex items-center gap-0.5">
                        <ThumbsDown className="w-3 h-3" /> {keepBlockVotes}
                      </span>
                      <span className="text-gray-500 flex items-center gap-0.5">
                        <Minus className="w-3 h-3" /> {neutralVotes}
                      </span>
                    </div>
                    <span>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Reason Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900 space-y-1">
                        <span className="font-bold text-red-900 dark:text-red-300 block">
                          Motivo Original do Bloqueio:
                        </span>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {req.blockReason}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900 space-y-1">
                        <span className="font-bold text-blue-900 dark:text-blue-300 block">
                          Defesa e Argumentação do Editor:
                        </span>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {req.appealReason}
                        </p>
                      </div>
                    </div>

                    {/* Community Votes Table */}
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          Votos da Comunidade ({votes.length})
                        </span>
                        {req.status !== 'aprovado' && req.status !== 'rejeitado' && (
                          <button
                            type="button"
                            onClick={() => {
                              setVotingOnId(req.id);
                              setVoteComment('');
                            }}
                            className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded font-medium flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Emitir Voto / Parecer</span>
                          </button>
                        )}
                      </div>

                      {votes.length === 0 ? (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded text-center">
                          Ainda não há votos nesta discussão. Seja o primeiro a emitir um parecer!
                        </div>
                      ) : (
                        <div className="border border-gray-200 dark:border-gray-700 rounded divide-y divide-gray-200 dark:divide-gray-700">
                          {votes.map((v, i) => (
                            <div key={i} className="p-2.5 flex items-start justify-between gap-3 bg-white dark:bg-gray-800/60">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 dark:text-gray-100">{v.user}</span>
                                  <span className="text-[10px] text-gray-400">({v.role})</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold text-[10px] uppercase ${
                                      v.vote === 'desbloquear'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : v.vote === 'manter_bloqueio'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                        : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {v.vote.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-[11px]">{v.comment}</p>
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {new Date(v.timestamp).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Voting Sub-form */}
                    {votingOnId === req.id && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded space-y-2">
                        <span className="font-bold text-blue-900 dark:text-blue-200 block">
                          Registrar Voto no Recurso
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="voteChoice"
                              checked={voteChoice === 'desbloquear'}
                              onChange={() => setVoteChoice('desbloquear')}
                            />
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Desbloquear</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                            <input
                              type="radio"
                              name="voteChoice"
                              checked={voteChoice === 'manter_bloqueio'}
                              onChange={() => setVoteChoice('manter_bloqueio')}
                            />
                            <span className="font-bold text-red-700 dark:text-red-400">Manter Bloqueio</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                            <input
                              type="radio"
                              name="voteChoice"
                              checked={voteChoice === 'neutro'}
                              onChange={() => setVoteChoice('neutro')}
                            />
                            <span className="font-bold text-gray-600 dark:text-gray-400">Neutro</span>
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={voteComment}
                          onChange={e => setVoteComment(e.target.value)}
                          placeholder="Justificativa do seu voto..."
                          className="w-full bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setVotingOnId(null)}
                            className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={submittingVote}
                            onClick={() => handleCastVote(req.id)}
                            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium flex items-center gap-1"
                          >
                            {submittingVote && <Clock className="w-3 h-3 animate-spin" />}
                            <span>Confirmar Voto</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verdict Display if Resolved */}
                    {req.verdictNote && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded space-y-1">
                        <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                          <span>Parecer e Conclusão Burocrática:</span>
                          <span className="text-[11px] font-normal">Revisado por: {req.reviewedBy || 'Burocrata'}</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                          {req.verdictNote}
                        </p>
                      </div>
                    )}

                    {/* Bureaucrat Resolution Action */}
                    {isBureaucrat && req.status !== 'aprovado' && req.status !== 'rejeitado' && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                        {resolvingId === req.id ? (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 rounded space-y-3">
                            <span className="font-bold text-purple-900 dark:text-purple-200 block">
                              Encerramento e Decisão Administrativa
                            </span>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="resolveVerdict"
                                  checked={resolveVerdict === 'aprovado'}
                                  onChange={() => setResolveVerdict('aprovado')}
                                />
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  Aprovar Desbloqueio (Revoga papel no Firestore)
                                </span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="resolveVerdict"
                                  checked={resolveVerdict === 'rejeitado'}
                                  onChange={() => setResolveVerdict('rejeitado')}
                                />
                                <span className="font-bold text-red-700 dark:text-red-400">
                                  Rejeitar Recurso (Manter Bloqueio)
                                </span>
                              </label>
                            </div>
                            <textarea
                              rows={2}
                              value={verdictNotes}
                              onChange={e => setVerdictNotes(e.target.value)}
                              placeholder="Síntese da decisão e recomendações de conduta..."
                              className="w-full bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setResolvingId(null)}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={resolving}
                                onClick={() => handleResolve(req)}
                                className="px-4 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center gap-1.5"
                              >
                                {resolving && <Clock className="w-3 h-3 animate-spin" />}
                                <span>Executar Decisão</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              Burocratas podem fechar o consenso e aplicar a decisão.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingId(req.id);
                                setResolveVerdict('aprovado');
                                setVerdictNotes('');
                              }}
                              className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium shadow-2xs"
                            >
                              Encerrar Discussão e Decidir
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

      {/* MODAL: NOVO PEDIDO DE DESBLOQUEIO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-blue-600" />
                <span>Submeter Pedido de Desbloqueio</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Usuário Bloqueado *
                </label>
                <input
                  type="text"
                  required
                  value={targetUsername}
                  onChange={e => setTargetUsername(e.target.value)}
                  placeholder="Nome de usuário..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Motivo Original do Bloqueio
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Ex: Guerra de edições, infração de conduta..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Justificativa da Apelação e Compromisso com a Política *
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealReason}
                  onChange={e => setAppealReason(e.target.value)}
                  placeholder="Explique os fatos, reconheça eventuais equívocos e declare adesão ao Código Universal de Conduta..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium flex items-center gap-1.5"
                >
                  {submitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Protocolar Recurso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
