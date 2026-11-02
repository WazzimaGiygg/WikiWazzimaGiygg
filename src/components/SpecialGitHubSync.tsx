import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  RefreshCw,
  Download,
  ExternalLink,
  GitCommit,
  CheckCircle,
  FileCode,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import {
  fetchWikimediaRepoInfo,
  fetchRecentCommits,
  fetchRepoReadme,
  GitHubRepoInfo,
  GitHubCommit,
} from '../services/githubService';
import { savePage } from '../services/wikiService';

export const SpecialGitHubSync: React.FC = () => {
  const { currentUser, navigateToPage } = useWiki();

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
        fetchWikimediaRepoInfo(),
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
    setIsImporting(true);
    setSyncStatus(null);

    try {
      // Build updated wikitext reflecting live GitHub data
      const commitListWikitext = commits
        .slice(0, 5)
        .map(
          c =>
            `* \`[https://github.com/wikimedia/mediawiki/commit/${c.sha} ${c.sha}]\` - '''${c.commit.author.name}''': ${c.commit.message.replace(/\|/g, '-')} (${new Date(c.commit.author.date).toLocaleDateString('pt-BR')})`
        )
        .join('\n');

      const wikitext = `{{Infobox software
| nome = Repositório wikimedia/mediawiki
| url = ${repoInfo.html_url}
| proprietário = Wikimedia Foundation
| estrelas = ${repoInfo.stargazers_count}
| forks = ${repoInfo.forks_count}
| issues = ${repoInfo.open_issues_count}
| branch_padrão = ${repoInfo.default_branch}
| licença = ${repoInfo.license?.name || 'GPL-2.0-or-later'}
| sincronizado_em = ${new Date().toLocaleString('pt-BR')}
}}

Este artigo reúne informações sincronizadas em tempo real a partir do repositório oficial do MediaWiki no GitHub: '''[${repoInfo.html_url} wikimedia/mediawiki]'''.

== Descrição Oficial ==
${repoInfo.description}

== Estatísticas do Upstream ==
* '''Estrelas no GitHub:''' ${repoInfo.stargazers_count}
* '''Forks da Comunidade:''' ${repoInfo.forks_count}
* '''Issues / Tickets Abertos:''' ${repoInfo.open_issues_count}
* '''Branch Principal:''' \`${repoInfo.default_branch}\`
* '''Última Atualização no Upstream:''' ${new Date(repoInfo.updated_at).toLocaleDateString('pt-BR')}

== Commits Recentes no Upstream ==
${commitListWikitext}

== README.md Oficial do MediaWiki ==
<syntaxhighlight lang="markdown">
${readme.slice(0, 2000)}
</syntaxhighlight>

== Comparativo com a Versão TypeScript ==
No MediaWiki TS, as rotinas em PHP de \`includes/actions\` e \`includes/storage\` foram convertidas em módulos tipados com TypeScript e banco de dados Google Cloud Firestore. Consulte [[Arquitetura_MediaWiki_TS]] para mais detalhes.

[[Categoria:Git]]
[[Categoria:Código Fonte]]
[[Categoria:Wikimedia]]
[[Categoria:MediaWiki]]`;

      await savePage({
        slug: 'Repositório_GitHub_Wikimedia',
        title: 'Repositório GitHub Wikimedia',
        content: wikitext,
        summary: `Sincronização automática com ${repoInfo.html_url} (${commits.length} commits importados)`,
        author: currentUser.username,
        authorId: currentUser.uid,
        minorEdit: false,
      });

      setSyncStatus('Artigo "Repositório GitHub Wikimedia" atualizado com sucesso no Firestore!');
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
            <span>Sincronizador GitHub: wikimedia/mediawiki</span>
          </span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recarregar API</span>
          </button>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Integração oficial com a API do GitHub para consultar e importar metadados de <a href="https://github.com/wikimedia/mediawiki" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">github.com/wikimedia/mediawiki</a> para este wiki.
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
            onClick={() => navigateToPage('Repositório_GitHub_Wikimedia')}
            className="font-semibold underline hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Ver artigo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Consultando API do GitHub para wikimedia/mediawiki...</span>
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

                <button
                  type="button"
                  onClick={handleSyncToWiki}
                  disabled={isImporting}
                  className="px-4 py-2 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                  <span>{isImporting ? 'A sincronizar com Firestore...' : 'Sincronizar dados para este Wiki'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Estrelas</div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {repoInfo.stargazers_count.toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Forks</div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {repoInfo.forks_count.toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Branch Padrão</div>
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
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-blue-600" />
              <span>Commits Recentes da Equipe Wikimedia Foundation</span>
            </h2>

            <div className="border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {commits.map(commit => (
                  <li
                    key={commit.sha}
                    className="p-3 hover:bg-white dark:hover:bg-gray-800/60 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 max-w-xl">
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded shrink-0">
                        {commit.sha}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {commit.commit.message}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Por <span className="font-medium">{commit.commit.author.name}</span> em{' '}
                          {new Date(commit.commit.author.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
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
                      className="text-gray-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <span className="text-[11px]">Ver no GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Upstream README.md viewer */}
          <div>
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span>README.md Original do Repositório</span>
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
