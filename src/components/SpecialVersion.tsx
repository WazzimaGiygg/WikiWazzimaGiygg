import React, { useState, useEffect } from 'react';
import { Info, GitBranch, Database, Shield, Code2, ExternalLink, Layers, CheckCircle2 } from 'lucide-react';
import { fetchWikimediaRepoInfo, GitHubRepoInfo } from '../services/githubService';

export const SpecialVersion: React.FC = () => {
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);

  useEffect(() => {
    fetchWikimediaRepoInfo().then(info => setRepoInfo(info));
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
          Informações técnicas sobre o MediaWiki TS, o ambiente de execução e a sincronização com o repositório oficial.
        </div>
      </div>

      {/* MediaWiki Software Info Table */}
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
                  <td className="p-2 font-bold text-blue-600">MediaWiki TS</td>
                  <td className="p-2 font-mono">1.43.0-ts</td>
                  <td className="p-2">GPL-2.0-or-later</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Port do MediaWiki PHP para TypeScript e Google Cloud Firestore
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Repositório Upstream</td>
                  <td className="p-2 font-mono">{repoInfo?.default_branch || 'master'}</td>
                  <td className="p-2">{repoInfo?.license?.spdx_id || 'GPL-2.0'}</td>
                  <td className="p-2">
                    <a
                      href="https://github.com/wikimedia/mediawiki"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>wikimedia/mediawiki no GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Linguagem de Execução</td>
                  <td className="p-2 font-mono">TypeScript 5.8+ / Node.js</td>
                  <td className="p-2">Apache-2.0</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Tipagem estática rigorosa substituindo a base clássica PHP
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Banco de Dados</td>
                  <td className="p-2 font-mono">Google Cloud Firestore</td>
                  <td className="p-2">Proprietary Cloud</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Armazenamento NoSQL em tempo real substituindo MySQL / MariaDB
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Interface Visual</td>
                  <td className="p-2 font-mono">React 19 + Vector Skin</td>
                  <td className="p-2">MIT / GPL</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Reativação do Vector moderno (2022) e Vector clássico (2010)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Extensions Table */}
        <div>
          <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 pb-1 mb-2 border-b border-gray-200 dark:border-gray-800">
            Extensões carregadas
          </h2>

          <div className="overflow-x-auto border border-[#a2a9b1] dark:border-gray-700 rounded bg-[#f8f9fa] dark:bg-gray-900">
            <table className="wikitable w-full text-left">
              <thead>
                <tr className="bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
                  <th className="p-2 font-semibold">Extensão</th>
                  <th className="p-2 font-semibold">Tipo</th>
                  <th className="p-2 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="p-2 font-medium text-blue-600">Parsoid-TS Parser</td>
                  <td className="p-2 font-mono text-[11px]">ParserHook</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Análise sintática de wikitexto, gerador de TOC e tabelas wikitables
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-blue-600">RevisionStore-Firestore</td>
                  <td className="p-2 font-mono text-[11px]">StorageBackend</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Gravação de revisões imutáveis na coleção subjacente do Firestore
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-blue-600">VisualDiff Myers</td>
                  <td className="p-2 font-mono text-[11px]">DiffEngine</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Comparação de linha e caractere entre duas revisões selecionadas
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-blue-600">Wikimedia GitHub Bridge</td>
                  <td className="p-2 font-mono text-[11px]">ApiConnector</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Sincronização em tempo real de commits e metadados com github.com/wikimedia/mediawiki
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-blue-600">Vector Skin Suite</td>
                  <td className="p-2 font-mono text-[11px]">Skin</td>
                  <td className="p-2 text-gray-600 dark:text-gray-400">
                    Temas Vector Moderno (2022), Vector Clássico (2010) e Modo Escuro
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Git Repository Card */}
        {repoInfo && (
          <div className="p-4 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded shadow-xs">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <span>Metadados do Repositório Oficial no GitHub</span>
            </h3>
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
      </div>
    </div>
  );
};
