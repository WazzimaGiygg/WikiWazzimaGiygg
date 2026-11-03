import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  RefreshCw,
  Download,
  ExternalLink,
  GitCommit,
  CheckCircle,
  FileCode,
  ArrowRight,
  LogIn,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import {
  fetchWikiRepoInfo,
  fetchRecentCommits,
  fetchRepoReadme,
  GitHubRepoInfo,
  GitHubCommit,
  OFFICIAL_REPO_NAME,
  OFFICIAL_REPO_URL,
} from '../services/githubService';
import { savePage } from '../services/wikiService';

export const SpecialGitHubSync: React.FC = () => {
  const { currentUser, navigateToPage, loginWithGoogle } = useWiki();

  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [readme, setReadme] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setSyncStatus(null);
    try {
      const [info, commitList, rawReadme] = await Promise.all([
        fetchWikiRepoInfo(),
        fetchRecentCommits(),
        fetchRepoReadme(),
      ]);
      setRepoInfo(info);
      setCommits(commitList);
      setReadme(rawReadme);
    } catch (err) {
      console.error('Failed to load GitHub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncToWiki = async () => {
    if (!repoInfo) return;
    if (currentUser.isAnonymous) {
      alert('Contribuições e sincronizações não são permitidas sem login. Por favor, autentique-se primeiro.');
      loginWithGoogle();
      return;
    }
    setIsImporting(true);
    setSyncStatus(null);

    try {
      // Build updated wikitext reflecting live GitHub data
      const commitListWikitext = commits
        .map(c => {
          const firstLine = c.commit.message.split('\n')[0].replace(/\|/g, '-');
          return `* \`[${c.html_url} ${c.sha}]\` - '''${c.commit.author.name}''': ${firstLine} (${new Date(c.commit.author.date).toLocaleDateString('pt-BR')})`;
        })
        .join('\n');

      const wikitext = `{{Infobox software
| nome = Repositório Oficial WikiWazzimaGiygg
| url = ${repoInfo.html_url}
| estrelas = ${repoInfo.stargazers_count}
| forks = ${repoInfo.forks_count}
| issues = ${repoInfo.open_issues_count}
| branch_padrão = ${repoInfo.default_branch}
| licença = ${repoInfo.license?.name || 'GPL-2.0-or-later'}
| sincronizado_em = ${new Date().toLocaleString('pt-BR')}
}}

Este artigo reúne os dados e atualizações sincronizados em tempo real a partir do repositório oficial no GitHub: '''[${repoInfo.html_url} ${OFFICIAL_REPO_NAME}]'''.

== Descrição Oficial ==
${repoInfo.description}

== Estatísticas do Repositório ==
* '''Repositório Oficial:''' [${repoInfo.html_url} ${repoInfo.full_name}]
* '''Estrelas no GitHub:''' ${repoInfo.stargazers_count}
* '''Forks da Comunidade:''' ${repoInfo.forks_count}
* '''Issues / Problemas Abertos:''' ${repoInfo.open_issues_count}
* '''Branch Principal:''' \`${repoInfo.default_branch}\`
* '''Último Push no GitHub:''' ${repoInfo.pushed_at ? new Date(repoInfo.pushed_at).toLocaleString('pt-BR') : 'Recente'}

== Histórico de Commits e Atualizações Recentes ==
${commitListWikitext}

== Arquitetura e Estrutura ==
O '''WikiWazzimaGiygg''' foi desenvolvido em TypeScript e executa sobre o Google Cloud Firestore em tempo real. Todas as páginas, discussões e extensões dinâmicas são sincronizadas diretamente com as coleções do Firestore.

[[Categoria:Git]]
[[Categoria:Código Fonte]]
[[Categoria:WikiWazzimaGiygg]]`;

      await savePage({
        slug: 'Repositório_GitHub_WikiWazzimaGiygg',
        title: 'Repositório GitHub WikiWazzimaGiygg',
        content: wikitext,
        summary: `Sincronização de commits e metadados de ${repoInfo.html_url} (${commits.length} commits importados)`,
        author: currentUser.username,
        authorId: currentUser.uid,
        minorEdit: false,
      });

      setSyncStatus('Artigo "Repositório GitHub WikiWazzimaGiygg" atualizado com sucesso no Firestore!');
    } catch (err: any) {
      console.error('Error syncing:', err);
      setSyncStatus('Erro ao sincronizar com Firestore: ' + (err.message || String(err)));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <span>Updates do Repositório: {OFFICIAL_REPO_NAME}</span>
          </span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recarregar GitHub API</span>
          </button>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Histórico de atualizações e sincronização de commits oficiais de{' '}
          <a
            href={OFFICIAL_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold"
          >
            {OFFICIAL_REPO_URL}
          </a>
          .
        </div>
      </div>

      {syncStatus && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{syncStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => navigateToPage('Repositório_GitHub_WikiWazzimaGiygg')}
            className="font-semibold underline hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver artigo no Wiki</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Consultando API do GitHub para {OFFICIAL_REPO_NAME}...</span>
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Main Repo Card */}
          {repoInfo && (
            <div className="p-4 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-gray-900 dark:text-gray-100">
                      {repoInfo.full_name}
                    </span>
                    <a
                      href={repoInfo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
                    {repoInfo.description}
                  </p>
                </div>

                {currentUser.isAnonymous ? (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                    title="Faça login com sua conta para sincronizar dados com o Firestore"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Entrar com Google para sincronizar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSyncToWiki}
                    disabled={isImporting}
                    className="px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                    <span>{isImporting ? 'A sincronizar com Firestore...' : 'Sincronizar dados para este Wiki'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Estrelas</div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {repoInfo.stargazers_count}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Forks</div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {repoInfo.forks_count}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Branch Principal</div>
                  <div className="text-base font-bold font-mono text-gray-900 dark:text-gray-100">
                    {repoInfo.default_branch}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Licença</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {repoInfo.license?.spdx_id || 'GPL-2.0'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commits List */}
          <div>
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-blue-600" />
                <span>Atualizações e Commits Recentes ({commits.length})</span>
              </h2>
              <span className="text-[11px] text-gray-500">
                Sincronizado diretamente de {OFFICIAL_REPO_NAME}
              </span>
            </div>

            <div className="border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {commits.map(commit => {
                  const [firstLine, ...rest] = commit.commit.message.split('\n');
                  return (
                    <li
                      key={commit.sha}
                      className="p-3.5 hover:bg-white dark:hover:bg-gray-800/60 flex flex-wrap items-start justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3 max-w-2xl">
                        {commit.author?.avatar_url ? (
                          <img
                            src={commit.author.avatar_url}
                            alt={commit.commit.author.name}
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {commit.commit.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                              {commit.sha}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {firstLine}
                            </span>
                          </div>
                          {rest.length > 0 && rest.join('\n').trim() && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1.5 whitespace-pre-line bg-gray-50 dark:bg-gray-800/70 p-2 rounded border border-gray-200 dark:border-gray-700 font-sans">
                              {rest.join('\n').trim()}
                            </p>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1.5">
                            Por <span className="font-semibold text-gray-700 dark:text-gray-300">{commit.commit.author.name}</span> em{' '}
                            {new Date(commit.commit.author.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold shrink-0"
                      >
                        <span>Ver no GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Repo README.md viewer */}
          <div>
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>Visão Geral do Repositório ({OFFICIAL_REPO_NAME})</span>
            </h2>

            <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-x-auto max-h-80 leading-relaxed border border-gray-700">
              {readme}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
