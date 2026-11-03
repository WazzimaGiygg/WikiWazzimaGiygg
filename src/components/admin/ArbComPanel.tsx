import React, { useState, useEffect } from 'react';
import {
  Scale,
  Gavel,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useWiki } from '../../context/WikiContext';
import { ArbComCase, ArbComStatus } from '../../types/wiki';
import {
  subscribeToArbComCases,
  createArbComCase,
  updateArbComCase,
} from '../../services/wikiService';

export const ArbComPanel: React.FC = () => {
  const { currentUser, isBureaucrat, navigateToPage } = useWiki();

  const [cases, setCases] = useState<ArbComCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Case Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('');
  const [plaintiff, setPlaintiff] = useState(currentUser.username || '');
  const [respondent, setRespondent] = useState('');
  const [summary, setSummary] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Arbitrator Ruling / Decision Form
  const [rulingCaseId, setRulingCaseId] = useState<string | null>(null);
  const [statusDecision, setStatusDecision] = useState<ArbComStatus>('decidido');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [remediesInput, setRemediesInput] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  useEffect(() => {
    const unsub = subscribeToArbComCases(fetchedCases => {
      setCases(fetchedCases);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !respondent.trim() || !summary.trim()) {
      setFormError('Preencha todos os campos obrigatórios (Título, Requerido e Resumo do Conflito).');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createArbComCase({
        title: title.trim(),
        plaintiff: plaintiff.trim() || currentUser.username || 'Requerente',
        plaintiffUid: currentUser.uid || 'anon',
        respondent: respondent.trim(),
        summary: summary.trim(),
        evidence: evidence.trim(),
        arbitrators: ['Burocrata Titular', 'Árbitro Comunitário'],
        status: 'aberto',
      });

      setShowNewModal(false);
      setTitle('');
      setRespondent('');
      setSummary('');
      setEvidence('');
      setActionSuccess('Petição submetida ao Conselho de Arbitragem com sucesso no Firestore.');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar petição no ArbCom.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRuling = async (caseItem: ArbComCase) => {
    if (!decisionNotes.trim()) {
      alert('Por favor, informe a fundamentação da decisão.');
      return;
    }
    setSavingDecision(true);
    try {
      const remediesList = remediesInput
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      await updateArbComCase(caseItem.id, {
        status: statusDecision,
        decision: decisionNotes.trim(),
        remedies: remediesList.length > 0 ? remediesList : undefined,
      });

      setRulingCaseId(null);
      setDecisionNotes('');
      setRemediesInput('');
      setActionSuccess('Acórdão e determinações do ArbCom publicados com sucesso!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Erro ao publicar decisão: ' + err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  const getStatusBadge = (status: ArbComStatus) => {
    switch (status) {
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Caso Aberto
          </span>
        );
      case 'em_deliberacao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Scale className="w-3 h-3" />
            Em Deliberação
          </span>
        );
      case 'decidido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Gavel className="w-3 h-3" />
            Julgado / Decidido
          </span>
        );
      case 'rejeitado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
            <XCircle className="w-3 h-3" />
            Admissibilidade Rejeitada
          </span>
        );
      case 'arquivado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700">
            Arquivado
          </span>
        );
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus === 'todos') return true;
    return c.status === filterStatus;
  });

  return (
    <div className="space-y-5 text-xs">
      {/* Intro Box */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800/60 rounded space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
              Conselho de Arbitragem (ArbCom)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPage('Wiki:Conselho_de_Arbitragem')}
              className="px-2.5 py-1 text-[11px] bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded text-purple-700 dark:text-purple-300 font-medium inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Regimento do ArbCom</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Abrir Caso no Conselho</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
          Órgão máximo da comunidade do WikiWazzimaGiygg para resolução vinculativa de disputas graves de conduta, abuso de privilégios e recursos finais. As deliberações e acórdãos são irrecorríveis no âmbito editorial.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded flex items-center justify-between gap-3">
        <span className="font-bold text-gray-700 dark:text-gray-300">
          Processos e Casos ({cases.length})
        </span>

        <div className="flex items-center gap-2">
          <label className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
          >
            <option value="todos">Todos os casos</option>
            <option value="aberto">Abertos</option>
            <option value="em_deliberacao">Em Deliberação</option>
            <option value="decidido">Decididos</option>
            <option value="rejeitado">Rejeitados</option>
            <option value="arquivado">Arquivados</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-600" />
          <span>Carregando processos do ArbCom...</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-gray-500">
          <Scale className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Nenhum processo de arbitragem registrado</p>
          <p className="text-[11px] mt-1">Não há disputas abertas no Conselho de Arbitragem.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map(caseItem => {
            const isExpanded = expandedId === caseItem.id;
            const isRuling = rulingCaseId === caseItem.id;

            return (
              <div
                key={caseItem.id}
                className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded overflow-hidden shadow-2xs"
              >
                {/* Case Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : caseItem.id)}
                  className="p-3 bg-[#f8f9fa] dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-[#a2a9b1]/60 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(caseItem.status)}
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      {caseItem.title}
                    </span>
                    <span className="text-gray-400">({caseItem.plaintiff} vs. {caseItem.respondent})</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <span>{new Date(caseItem.createdAt).toLocaleDateString('pt-BR')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Parties and Arbitrators Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Parte Autora (Requerente):</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{caseItem.plaintiff}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Parte Requerida:</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{caseItem.respondent}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Colegiado de Árbitros:</span>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">
                          {(caseItem.arbitrators || ['Burocratas']).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Summary and Evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">Objeto e Petição Inicial:</span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {caseItem.summary}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">Difs e Registros Comprobatórios:</span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                          {caseItem.evidence || 'Nenhuma evidência externa anexada.'}
                        </div>
                      </div>
                    </div>

                    {/* Published Ruling & Remedies */}
                    {caseItem.decision && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                          <Gavel className="w-4 h-4 text-emerald-600" />
                          <span>Acórdão e Julgamento do Conselho:</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {caseItem.decision}
                        </p>

                        {caseItem.remedies && caseItem.remedies.length > 0 && (
                          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 space-y-1">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[11px]">
                              Determinações e Sanções Vinculativas (Remédios):
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-800 dark:text-gray-200 text-[11px]">
                              {caseItem.remedies.map((rem, i) => (
                                <li key={i}>{rem}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bureaucrat / Arbitrator Ruling Panel */}
                    {isBureaucrat && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                        {isRuling ? (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 rounded space-y-3">
                            <span className="font-bold text-purple-900 dark:text-purple-200 block">
                              Proferir Veredito e Sanções do ArbCom
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="text-gray-700 dark:text-gray-300 font-bold">Status:</label>
                              <select
                                value={statusDecision}
                                onChange={e => setStatusDecision(e.target.value as ArbComStatus)}
                                className="bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
                              >
                                <option value="em_deliberacao">Em Deliberação</option>
                                <option value="decidido">Decidido / Julgado</option>
                                <option value="rejeitado">Rejeitado</option>
                                <option value="arquivado">Arquivado</option>
                              </select>
                            </div>

                            <textarea
                              rows={3}
                              value={decisionNotes}
                              onChange={e => setDecisionNotes(e.target.value)}
                              placeholder="Texto do acórdão e fundamentos jurídicos comunitários..."
                              className="w-full bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                            />

                            <div>
                              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Remédios e Sanções (um por linha):
                              </label>
                              <textarea
                                rows={2}
                                value={remediesInput}
                                onChange={e => setRemediesInput(e.target.value)}
                                placeholder="Ex: Proibição de edição em artigos do tópico X por 6 meses&#10;Advertência formal aos dois editores&#10;Supervisão obrigatória de mentor"
                                className="w-full bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setRulingCaseId(null)}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={savingDecision}
                                onClick={() => handleSaveRuling(caseItem)}
                                className="px-4 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center gap-1.5"
                              >
                                {savingDecision && <Clock className="w-3 h-3 animate-spin" />}
                                <span>Publicar Acórdão</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              Árbitros e Burocratas podem deliberar e registrar o acórdão.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRulingCaseId(caseItem.id);
                                setStatusDecision(caseItem.status);
                                setDecisionNotes(caseItem.decision || '');
                                setRemediesInput((caseItem.remedies || []).join('\n'));
                              }}
                              className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium shadow-2xs"
                            >
                              Deliberar / Publicar Julgamento
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

      {/* MODAL: NOVO CASO ARBCOM */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                <span>Submeter Petição ao ArbCom</span>
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

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Título do Caso *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Disputa editorial e conduta reiterada no artigo X"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Requerente (Você)
                  </label>
                  <input
                    type="text"
                    value={plaintiff}
                    onChange={e => setPlaintiff(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Parte Requerida *
                  </label>
                  <input
                    type="text"
                    required
                    value={respondent}
                    onChange={e => setRespondent(e.target.value)}
                    placeholder="Nome do usuário da outra parte..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Resumo da Disputa e Tentativas Prévias de Resolução *
                </label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Descreva detalhadamente o conflito e por que a mediação regular falhou..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Evidências e Difs
                </label>
                <textarea
                  rows={2}
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  placeholder="Links de revisões, comentários na discussão e registros de violação..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100 font-mono"
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
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium flex items-center gap-1.5"
                >
                  {submitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submeter ao ArbCom</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
