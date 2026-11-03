import React, { useState, useEffect } from 'react';
import { Info, GitBranch, Database, Shield, Code2, ExternalLink, Layers, CheckCircle2, Blocks, GitCommit, RefreshCw } from 'lucide-react';
import { fetchWikiRepoInfo, fetchRecentCommits, GitHubRepoInfo, GitHubCommit, OFFICIAL_REPO_URL } from '../services/githubService';
import { useWiki } from '../context/WikiContext';
import { subscribeToExtensions } from '../services/extensionService';
import { WikiExtensionDoc } from '../extensions/types';

export const SpecialVersion: React.FC = () => {
  const { navigateToPage } = useWiki();
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [extensions, setExtensions] = useState<WikiExtensionDoc[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(true);

  useEffect(() => {
    fetchWikiRepoInfo().then(info => setRepoInfo(info));
    fetchRecentCommits()
      .then(list => setCommits(list))
      .finally(() => setLoadingCommits(false));
    const unsubscribe = subscribeToExtensions(list => setExtensions(list));
    return () => unsubscribe();
  }, []);

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Info className="w-6 h-6 text-blue-600" />
          <span>Versão do sistema</span>
        </h1>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Informações técnicas sobre o WikiWazzimaGiygg, repositório GitHub e ambiente de execução Firestore.
        </div>
      </div>

      {/* Software Info Table */}
      <div className="space-y-6 text-xs">
        <div>
          <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
            Software instalado
          </h2>

          <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
            <table className="wikitable w-full text-left">
              <thead>
                <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
                  <th className="p-2 font-semibold">Produto</th>
                  <th className="p-2 font-semibold">Versão</th>
                  <th className="p-2 font-semibold">Licença</th>
                  <th className="p-2 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="p-2 font-bold text-blue-600">WikiWazzimaGiygg</td>
                  <td className="p-2 font-mono">1.0.0-ts</td>
                  <td className="p-2">GPL-2.0-or-later</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Engine Wiki em TypeScript e Google Cloud Firestore em tempo real
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Repositório GitHub Oficial</td>
                  <td className="p-2 font-mono">{repoInfo?.default_branch || 'main'}</td>
                  <td className="p-2">{repoInfo?.license?.spdx_id || 'GPL-2.0'}</td>
                  <td className="p-2">
                    <a
                      href={OFFICIAL_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>WazzimaGiygg/WikiWazzimaGiygg</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Linguagem de Execução</td>
                  <td className="p-2 font-mono">TypeScript 5.8+ / Node.js</td>
                  <td className="p-2">Apache-2.0</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Tipagem estática rigorosa com suporte reativo em tempo real
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Banco de Dados</td>
                  <td className="p-2 font-mono">Google Cloud Firestore</td>
                  <td className="p-2">Cloud Firestore</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Armazenamento NoSQL e listeners onSnapshot em tempo real
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Interface Visual</td>
                  <td className="p-2 font-mono">React 19 + Vector Skin</td>
                  <td className="p-2">MIT / GPL</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Temas Vector Moderno (2022), Vector Clássico (2010) e Modo Escuro
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Extensions Table */}
        <div>
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100">
                Extensões e módulos registrados ({extensions.length})
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                {extensions.filter(e => e.isActive).length} ativadas no Firebase
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateToPage('Especial:Extensões')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Blocks className="w-3.5 h-3.5" />
              <span>Gerenciar e testar no Especial:Extensões →</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
            <table className="wikitable w-full text-left">
              <thead>
                <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
                  <th className="p-2 font-semibold">Extensão / Módulo</th>
                  <th className="p-2 font-semibold">Versão</th>
                  <th className="p-2 font-semibold">Categoria</th>
                  <th className="p-2 font-semibold">Status Firebase</th>
                  <th className="p-2 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {extensions.map(ext => (
                  <tr key={ext.id}>
                    <td className="p-2 font-medium text-blue-600">
                      <button
                        type="button"
                        onClick={() => navigateToPage('Especial:Extensões')}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {ext.name}
                      </button>
                    </td>
                    <td className="p-2 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                      v{ext.version}
                    </td>
                    <td className="p-2 uppercase text-[10px] font-mono text-gray-500">
                      {ext.category}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          ext.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {ext.isActive ? 'Ativada' : 'Desativada'}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600 dark:text-gray-400 text-[11px]">
                      {ext.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Git Repository Card */}
        {repoInfo && (
          <div className="p-4 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Repositório GitHub Oficial: {repoInfo.full_name}</span>
              </h3>
              <a
                href={repoInfo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
              >
                <span>Acessar no GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">{repoInfo.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {repoInfo.stargazers_count}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">Estrelas no GitHub</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {repoInfo.forks_count}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">Forks</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {repoInfo.open_issues_count}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">Issues Abertas</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-base text-emerald-600">Online</div>
                <div className="text-[10px] text-gray-500 uppercase">Status da Conexão</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Commits Stream */}
        <div>
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-blue-600" />
              <span>Recentes Updates do Repositório (WazzimaGiygg/WikiWazzimaGiygg)</span>
            </h2>
            <button
              type="button"
              onClick={() => navigateToPage('Especial:GitHubSync')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Abrir Sincronizador Completo →</span>
            </button>
          </div>

          <div className="border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden">
            {loadingCommits ? (
              <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Carregando commits recentes...</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {commits.map(commit => {
                  const [firstLine, ...rest] = commit.commit.message.split('\n');
                  return (
                    <li
                      key={commit.sha}
                      className="p-3 hover:bg-white dark:hover:bg-gray-800/60 flex flex-wrap items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 max-w-2xl">
                        {commit.author?.avatar_url ? (
                          <img
                            src={commit.author.avatar_url}
                            alt={commit.commit.author.name}
                            className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {commit.commit.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">
                              {commit.sha}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {firstLine}
                            </span>
                          </div>
                          {rest.length > 0 && rest.join('\n').trim() && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line bg-gray-50 dark:bg-gray-800/80 p-1.5 rounded border border-gray-200 dark:border-gray-700">
                              {rest.join('\n').trim()}
                            </p>
                          )}
                          <div className="text-[10px] text-gray-500 mt-1">
                            Commit realizado por <span className="font-medium text-gray-700 dark:text-gray-300">{commit.commit.author.name}</span> em{' '}
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
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium shrink-0"
                      >
                        <span>Ver commit</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
