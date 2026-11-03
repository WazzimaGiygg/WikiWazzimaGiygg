import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserX,
  FileWarning,
} from 'lucide-react';
import { useWiki } from '../../context/WikiContext';
import { UCoCReport, UCoCCategory, UCoCStatus } from '../../types/wiki';
import {
  subscribeToUCoCReports,
  createUCoCReport,
  resolveUCoCReport,
} from '../../services/wikiService';

export const UCoCPanel: React.FC = () => {
  const { currentUser, isBureaucrat, navigateToPage } = useWiki();

  const [reports, setReports] = useState<UCoCReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Report Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [reportedUser, setReportedUser] = useState('');
  const [category, setCategory] = useState<UCoCCategory>('assedio_perseguicao');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Bureaucrat Resolution Form
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<UCoCStatus>('resolvido');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUCoCReports(fetchedReports => {
      setReports(fetchedReports);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedUser.trim() || !description.trim()) {
      setFormError('Informe o usuário denunciado e a descrição da ocorrência.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createUCoCReport({
        reportedUser: reportedUser.trim(),
        reporter: currentUser.username || 'Colaborador Anônimo',
        reporterUid: currentUser.uid || 'anon',
        category,
        description: description.trim(),
        evidence: evidence.trim(),
      });

      setShowNewModal(false);
      setReportedUser('');
      setDescription('');
      setEvidence('');
      setActionSuccess('Denúncia de infração ao UCoC registrada com sucesso no Firestore.');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar denúncia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveReport = async (report: UCoCReport) => {
    if (!resolutionNotes.trim()) {
      alert('Por favor, informe a justificativa ou parecer da resolução.');
      return;
    }
    setResolving(true);
    try {
      await resolveUCoCReport(
        report.id,
        resolutionStatus,
        resolutionNotes.trim(),
        currentUser.username || 'Burocrata'
      );
      setResolvingId(null);
      setResolutionNotes('');
      setActionSuccess('Denúncia UCoC resolvida e arquivada com sucesso!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Erro ao resolver denúncia: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  const getCategoryLabel = (cat: UCoCCategory) => {
    switch (cat) {
      case 'assedio_perseguicao':
        return 'Assédio / Perseguição (Wikihounding)';
      case 'discriminacao_odio':
        return 'Discriminação / Discurso de Ódio';
      case 'abuso_de_poder':
        return 'Abuso de Poder ou Ferramentas';
      case 'guerra_de_edicoes':
        return 'Guerra de Edições Hostil';
      case 'doxxing':
        return 'Doxxing / Violação de Privacidade';
      case 'outros':
        return 'Outra Infração ao UCoC';
    }
  };

  const getStatusBadge = (status: UCoCStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Nova Denúncia
          </span>
        );
      case 'em_analise':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <ShieldAlert className="w-3 h-3" />
            Em Análise
          </span>
        );
      case 'resolvido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Resolvido / Sancionado
          </span>
        );
      case 'improcedente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-400 dark:border-gray-700">
            <XCircle className="w-3 h-3" />
            Improcedente
          </span>
        );
      case 'arquivado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Arquivado
          </span>
        );
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterStatus !== 'todos' && r.status !== filterStatus) return false;
    if (filterCategory !== 'todos' && r.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-5 text-xs">
      {/* Intro Box */}
      <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800/60 rounded space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-700 dark:text-rose-400" />
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
              Código Universal de Conduta (UCoC) & Ouvidoria
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPage('Wiki:Código_Universal_de_Conduta')}
              className="px-2.5 py-1 text-[11px] bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded text-rose-700 dark:text-rose-300 font-medium inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Ver Política UCoC</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Denúncia UCoC</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
          Canal dedicado à segurança, respeito mútuo e conformidade com o Código Universal de Conduta no WikiWazzimaGiygg. Denúncias são acompanhadas em tempo real e auditadas pelos burocratas.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold text-gray-700 dark:text-gray-300">
          Denúncias Registradas ({reports.length})
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">Categoria:</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
            >
              <option value="todos">Todas as categorias</option>
              <option value="assedio_perseguicao">Assédio / Perseguição</option>
              <option value="discriminacao_odio">Discriminação / Ódio</option>
              <option value="abuso_de_poder">Abuso de Poder</option>
              <option value="guerra_de_edicoes">Guerra de Edições</option>
              <option value="doxxing">Doxxing</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 dark:text-gray-400 font-medium text-[11px]">Status:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Nova Denúncia</option>
              <option value="em_analise">Em Análise</option>
              <option value="resolvido">Resolvido</option>
              <option value="improcedente">Improcedente</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-rose-600" />
          <span>Carregando denúncias do UCoC...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-gray-500">
          <Flag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Nenhuma denúncia pendente</p>
          <p className="text-[11px] mt-1">O ambiente da comunidade está em plena harmonia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => {
            const isExpanded = expandedId === report.id;
            const isResolving = resolvingId === report.id;

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded overflow-hidden shadow-2xs"
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="p-3 bg-[#f8f9fa] dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex flex-wrap items-center justify-between gap-2 border-b border-[#a2a9b1]/60 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(report.status)}
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                      Denunciado: {report.reportedUser}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {getCategoryLabel(report.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <span>Por: <strong>{report.reporter}</strong></span>
                    <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Description and Evidences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">
                          Relato da Infração:
                        </span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                          {report.description}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-gray-700 dark:text-gray-300 block">
                          Evidências e Difs Apresentados:
                        </span>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                          {report.evidence || 'Nenhuma evidência anexada.'}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Notes if Resolved */}
                    {report.resolution && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded space-y-1">
                        <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                          <span>Parecer e Medida Adotada pela Moderação:</span>
                          <span className="text-[11px] font-normal">Atendido por: {report.handledBy || 'Burocrata'}</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-[11px] whitespace-pre-line">
                          {report.resolution}
                        </p>
                      </div>
                    )}

                    {/* Bureaucrat Moderation Panel */}
                    {isBureaucrat && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                        {isResolving ? (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 rounded space-y-3">
                            <span className="font-bold text-rose-900 dark:text-rose-200 block">
                              Concluir Análise da Denúncia
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="text-gray-700 dark:text-gray-300 font-bold">Veredito:</label>
                              <select
                                value={resolutionStatus}
                                onChange={e => setResolutionStatus(e.target.value as UCoCStatus)}
                                className="bg-white dark:bg-gray-800 border border-rose-300 dark:border-rose-700 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-gray-100"
                              >
                                <option value="em_analise">Em Análise</option>
                                <option value="resolvido">Resolvido (Sancionado / Advertido)</option>
                                <option value="improcedente">Improcedente</option>
                                <option value="arquivado">Arquivado</option>
                              </select>
                            </div>

                            <textarea
                              rows={3}
                              value={resolutionNotes}
                              onChange={e => setResolutionNotes(e.target.value)}
                              placeholder="Medidas disciplinares aplicadas ou justificativa do arquivamento..."
                              className="w-full bg-white dark:bg-gray-800 border border-rose-300 dark:border-rose-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
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
                                onClick={() => handleResolveReport(report)}
                                className="px-4 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-medium flex items-center gap-1.5"
                              >
                                {resolving && <Clock className="w-3 h-3 animate-spin" />}
                                <span>Registrar Resolução</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              Burocratas e mediadores podem emitir parecer disciplinar.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingId(report.id);
                                setResolutionStatus(report.status);
                                setResolutionNotes(report.resolution || '');
                              }}
                              className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-medium shadow-2xs"
                            >
                              Moderar / Encerrar Denúncia
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

      {/* MODAL: NOVA DENÚNCIA UCOC */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-600" />
                <span>Registrar Denúncia de Violação do UCoC</span>
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

            <form onSubmit={handleCreateReport} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Usuário Infrator Denunciado *
                </label>
                <input
                  type="text"
                  required
                  value={reportedUser}
                  onChange={e => setReportedUser(e.target.value)}
                  placeholder="Nome de usuário..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Natureza da Violação (Categoria) *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as UCoCCategory)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                >
                  <option value="assedio_perseguicao">Assédio / Perseguição (Wikihounding)</option>
                  <option value="discriminacao_odio">Discriminação / Discurso de Ódio</option>
                  <option value="abuso_de_poder">Abuso de Poder ou Ferramentas</option>
                  <option value="guerra_de_edicoes">Guerra de Edições Sistemática</option>
                  <option value="doxxing">Doxxing / Exposição de Dados Pessoais</option>
                  <option value="outros">Outra Infração de Conduta</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Descrição Circunstanciada dos Fatos *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o que ocorreu, datas aproximadas e impacto para a colaboração..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Evidências / Links de Difs Comprobatórios
                </label>
                <textarea
                  rows={2}
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  placeholder="Links de páginas, revisões ou comentários relevantes..."
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
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-medium flex items-center gap-1.5"
                >
                  {submitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Registrar Denúncia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
