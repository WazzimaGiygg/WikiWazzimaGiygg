import React, { useState, useEffect } from 'react';
import {
  Layers,
  Code2,
  Cpu,
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  Play,
  Terminal,
  FileCode,
  ShieldCheck,
  Palette,
  Sparkles,
  Info,
  RefreshCw,
  PlusCircle,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  FolderSync,
  HelpCircle,
  X,
  Server,
  Zap,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { parseWikitext } from '../core/parser';
import {
  subscribeToExtensions,
  syncCodebaseExtensionsToFirestore,
  toggleExtensionActiveInFirestore,
  createBureaucratExtension,
  deleteBureaucratExtension,
} from '../services/extensionService';
import { WikiExtensionDoc, ExtensionCategory } from '../extensions/types';
import { CODEBASE_EXTENSIONS } from '../extensions';

export const SpecialExtensions: React.FC = () => {
  const { navigateToPage, existingPageSlugs, isBureaucrat, currentUser } = useWiki();

  const [extensions, setExtensions] = useState<WikiExtensionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingDirs, setIsSyncingDirs] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters & selection
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExtensionCategory>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<WikiExtensionDoc | null>(null);

  // Modal for Bureaucrat to Add New Extension
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExtForm, setNewExtForm] = useState({
    name: '',
    category: 'parser' as ExtensionCategory,
    version: '1.0.0-ts',
    authors: '',
    description: '',
    url: '',
    license: 'GPL-2.0-or-later',
    hooks: '',
    exampleWikitext: '',
    isActive: true,
  });
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Interactive playground state
  const [playgroundInput, setPlaygroundInput] = useState<string>('');
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  // 1. REAL-TIME SUBSCRIPTION TO FIRESTORE
  useEffect(() => {
    // Sync codebase extensions on mount
    syncCodebaseExtensionsToFirestore().then(res => {
      if (res.syncedCount > 0) {
        setSyncMessage(`${res.syncedCount} nova(s) extensão(ões) do diretório sincronizada(s) para o Firebase!`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
    });

    // Real-time listener
    const unsubscribe = subscribeToExtensions(extList => {
      setExtensions(extList);
      setLoading(false);

      if (!selectedExtension && extList.length > 0) {
        setSelectedExtension(extList[0]);
        setPlaygroundInput(extList[0].exampleWikitext || '');
      } else if (selectedExtension) {
        // Keep selected extension data updated with remote doc
        const updated = extList.find(e => e.id === selectedExtension.id);
        if (updated) {
          setSelectedExtension(updated);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Update playground input when selected extension changes
  const handleSelectExtension = (ext: WikiExtensionDoc) => {
    setSelectedExtension(ext);
    if (ext.exampleWikitext) {
      setPlaygroundInput(ext.exampleWikitext);
      setRenderedHtml('');
    }
  };

  // Run Parsoid / Wikitext playground
  const handleRunPlayground = () => {
    const result = parseWikitext(playgroundInput, existingPageSlugs);
    setRenderedHtml(result.html);
  };

  // Manual trigger to scan codebase directories and sync to Firestore
  const handleManualSyncDirectories = async () => {
    if (isSyncingDirs) return;
    setIsSyncingDirs(true);
    setSyncMessage(null);
    try {
      const res = await syncCodebaseExtensionsToFirestore();
      if (res.syncedCount > 0) {
        setSyncMessage(`Sucesso! ${res.syncedCount} extensão(ões) adicionada(s) nos diretórios foram sincronizadas.`);
      } else {
        setSyncMessage(`Todas as ${res.totalCodebase} extensões dos diretórios já estão sincronizadas com o Firebase.`);
      }
    } catch (err) {
      setSyncMessage('Erro ao sincronizar com o Firebase.');
    } finally {
      setIsSyncingDirs(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Toggle extension Active/Inactive in Firestore (BUREAUCRAT ONLY)
  const handleToggleActive = async (ext: WikiExtensionDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isBureaucrat) {
      alert('Ação bloqueada: Apenas burocratas têm permissão para ativar ou desativar extensões.');
      return;
    }

    setTogglingId(ext.id);
    try {
      await toggleExtensionActiveInFirestore(
        ext.id,
        !ext.isActive,
        isBureaucrat,
        currentUser.username
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar estado da extensão no Firebase.');
    } finally {
      setTogglingId(null);
    }
  };

  // Delete bureaucrat-created extension (BUREAUCRAT ONLY)
  const handleDeleteExtension = async (ext: WikiExtensionDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isBureaucrat) return;

    if (ext.installedVia === 'code') {
      alert('Extensões do código base não podem ser excluídas, apenas desativadas.');
      return;
    }

    if (!confirm(`Deseja realmente remover a extensão "${ext.name}" do Firebase?`)) {
      return;
    }

    try {
      await deleteBureaucratExtension(ext.id, isBureaucrat);
      if (selectedExtension?.id === ext.id) {
        setSelectedExtension(extensions.find(e => e.id !== ext.id) || null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir extensão.');
    }
  };

  // Submit new extension added by bureaucrat
  const handleCreateExtensionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBureaucrat) {
      setFormError('Apenas burocratas podem adicionar extensões.');
      return;
    }

    if (!newExtForm.name.trim() || !newExtForm.description.trim()) {
      setFormError('Nome e descrição são campos obrigatórios.');
      return;
    }

    setIsSubmittingNew(true);
    setFormError(null);

    try {
      const authorsList = newExtForm.authors
        ? newExtForm.authors.split(',').map(a => a.trim()).filter(Boolean)
        : [currentUser.username];

      const hooksList = newExtForm.hooks
        ? newExtForm.hooks.split(',').map(h => h.trim()).filter(Boolean)
        : ['ParserFirstCallInit'];

      const created = await createBureaucratExtension(
        {
          name: newExtForm.name.trim(),
          category: newExtForm.category,
          version: newExtForm.version.trim() || '1.0.0-ts',
          authors: authorsList,
          description: newExtForm.description.trim(),
          url: newExtForm.url.trim() || 'https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:Extensions',
          license: newExtForm.license.trim() || 'GPL-2.0-or-later',
          hooks: hooksList,
          exampleWikitext: newExtForm.exampleWikitext.trim() || `{{Aviso|Extensão ${newExtForm.name} em funcionamento!}}`,
          isActive: newExtForm.isActive,
        },
        isBureaucrat,
        currentUser.uid,
        currentUser.username
      );

      setIsAddModalOpen(false);
      setSelectedExtension(created);
      setPlaygroundInput(created.exampleWikitext || '');
      setNewExtForm({
        name: '',
        category: 'parser',
        version: '1.0.0-ts',
        authors: '',
        description: '',
        url: '',
        license: 'GPL-2.0-or-later',
        hooks: '',
        exampleWikitext: '',
        isActive: true,
      });
      setSyncMessage(`Extensão "${created.name}" registrada com sucesso no Firebase!`);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar extensão no Firebase.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filtered list
  const filteredExtensions = extensions.filter(ext => {
    const matchesCategory = categoryFilter === 'all' || ext.category === categoryFilter;
    const matchesSearch =
      ext.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ext.authors.some(a => a.toLowerCase().includes(searchFilter.toLowerCase())) ||
      ext.hooks.some(h => h.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeCount = extensions.filter(e => e.isActive).length;
  const codeCount = extensions.filter(e => e.installedVia === 'code').length;
  const bureaucratCount = extensions.filter(e => e.installedVia === 'bureaucrat').length;

  return (
    <div className="py-2">
      {/* Title Header */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <span>Extensões do WikiWazzimaGiygg</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Zap className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Firebase em Tempo Real</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Bureaucrat Role Badge */}
            {isBureaucrat ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Modo Burocrata (Controle Ativo)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded text-[11px]">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>Modo Leitura (Restrito a Burocratas)</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => navigateToPage('Especial:Versão')}
              className="text-[#0645ad] dark:text-[#6ba4ff] hover:underline flex items-center gap-1 ml-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Special:Version</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center justify-between gap-2">
          <span>
            As alterações, adições e desativações são sincronizadas com o Firebase Firestore pelos burocratas. Novas extensões no diretório (/src/extensions) sincronizam-se automaticamente.
          </span>
          <span className="font-mono text-blue-700 dark:text-blue-300">
            Especial:Extensões
          </span>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className="p-2.5 mb-4 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Non-Bureaucrat Notice Banner */}
      {!isBureaucrat && (
        <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Acesso Informativo:</strong> Você pode navegar pelo catálogo de extensões, auditar os ganchos e testar sintaxes no simulador. Para <strong>ativar</strong>, <strong>desativar</strong> ou <strong>adicionar novas extensões</strong> no Firebase, você precisa de privilégios de <em>Burocrata</em> (concedidos em <button onClick={() => navigateToPage('Especial:Permissões_de_usuário')} className="underline text-blue-700 dark:text-blue-300 font-semibold">Especial:Permissões_de_usuário</button>).
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 text-xs">
        <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-semibold text-[10px] uppercase">Extensões Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeCount} / {extensions.length}
          </div>
          <div className="text-[10px] text-gray-500">
            {extensions.length > 0 ? `${Math.round((activeCount / extensions.length) * 100)}% ativadas` : 'Carregando...'}
          </div>
        </div>

        <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-semibold text-[10px] uppercase">Do Código Base</span>
            <Code2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600 font-mono">
            {codeCount}
          </div>
          <div className="text-[10px] text-gray-500">/src/extensions/*</div>
        </div>

        <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-semibold text-[10px] uppercase">Por Burocratas</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600 font-mono">
            {bureaucratCount}
          </div>
          <div className="text-[10px] text-gray-500">Registros no Firebase</div>
        </div>

        <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-semibold text-[10px] uppercase">Sincronizador</span>
            <FolderSync className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            Ativo
          </div>
          <div className="text-[10px] text-gray-500">Auto-detecção em diretórios</div>
        </div>

        <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-semibold text-[10px] uppercase">Banco de Dados</span>
            <Server className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Firestore
          </div>
          <div className="text-[10px] text-gray-500">Coleção: wiki_extensions</div>
        </div>
      </div>

      {/* Bureaucrat Action Toolbar */}
      <div className="p-3 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded mb-4 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Extension Button (Bureaucrat Only) */}
          <button
            type="button"
            disabled={!isBureaucrat}
            onClick={() => setIsAddModalOpen(true)}
            className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors shadow-2xs ${
              isBureaucrat
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700'
            }`}
            title={isBureaucrat ? 'Adicionar nova extensão ao Firebase' : 'Apenas burocratas podem adicionar extensões'}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Nova Extensão</span>
            {!isBureaucrat && <Lock className="w-3 h-3 text-gray-400" />}
          </button>

          {/* Sync Directory Extensions Button */}
          <button
            type="button"
            onClick={handleManualSyncDirectories}
            disabled={isSyncingDirs}
            className="px-3 py-1.5 rounded font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Verifica se há novos arquivos criados em /src/extensions e os sincroniza com o Firebase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDirs ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncingDirs ? 'Verificando Diretórios...' : 'Sincronizar Diretórios (/src/extensions)'}</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <FolderSync className="w-3.5 h-3.5 text-blue-500" />
          <span>Qualquer arquivo adicionado em <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/src/extensions</code> é sincronizado automaticamente</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded mb-6 text-xs flex flex-wrap items-center justify-between gap-3">
        {/* Category Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              ['all', 'Todas'],
              ['parser', 'Analisador (Parser)'],
              ['media', 'Edição & Mídia'],
              ['admin', 'Administração'],
              ['skin', 'Aparência & Skins'],
              ['api', 'API & Serviços'],
            ] as const
          ).map(([catKey, label]) => {
            const count =
              catKey === 'all'
                ? extensions.length
                : extensions.filter(e => e.category === catKey).length;
            const isSelected = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey as any)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filtrar por nome, gancho ou autor..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Grid: Extension Cards & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Column: Extension Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="pb-1 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Extensões ({filteredExtensions.length})</span>
              {loading && <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />}
            </h2>
            <span className="text-[10px] text-gray-500 font-normal">
              {isBureaucrat ? 'Burocrata: use o interruptor para ativar/desativar' : 'Modo somente leitura'}
            </span>
          </div>

          {filteredExtensions.length === 0 && !loading && (
            <div className="p-8 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded text-gray-500">
              Nenhuma extensão encontrada para os filtros selecionados.
            </div>
          )}

          <div className="space-y-2.5">
            {filteredExtensions.map(ext => {
              const isSelected = selectedExtension?.id === ext.id;
              const isToggling = togglingId === ext.id;

              return (
                <div
                  key={ext.id}
                  onClick={() => handleSelectExtension(ext)}
                  className={`p-3.5 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-gray-900 border-[#a2a9b1] dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-400">
                        {ext.name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        v{ext.version}
                      </span>

                      {/* Origin Badge */}
                      {ext.installedVia === 'code' ? (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          title="Sincronizado automaticamente do diretório /src/extensions"
                        >
                          Diretório Código
                        </span>
                      ) : (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          title={`Criada por burocrata: ${ext.addedByName || 'Administrador'}`}
                        >
                          Burocrata (Firebase)
                        </span>
                      )}
                    </div>

                    {/* Actions & Toggle */}
                    <div className="flex items-center gap-2">
                      {/* Active/Inactive Toggle */}
                      <button
                        type="button"
                        onClick={e => handleToggleActive(ext, e)}
                        disabled={!isBureaucrat || isToggling}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                          ext.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                        } ${!isBureaucrat ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={
                          !isBureaucrat
                            ? 'Apenas burocratas podem alterar o status desta extensão'
                            : ext.isActive
                            ? 'Clique para desativar no Firebase'
                            : 'Clique para ativar no Firebase'
                        }
                      >
                        {isToggling ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                        ) : ext.isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="w-3 h-3 text-gray-400" />
                        )}
                        <span>{ext.isActive ? 'Ativada' : 'Desativada'}</span>
                      </button>

                      {/* Delete button (Bureaucrat extensions only) */}
                      {isBureaucrat && ext.installedVia === 'bureaucrat' && (
                        <button
                          type="button"
                          onClick={e => handleDeleteExtension(ext, e)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                          title="Excluir extensão do Firebase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <a
                        href={ext.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-600 p-0.5"
                        title="Documentação oficial"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-[11px] mb-2 leading-relaxed">
                    {ext.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500">
                    <div>
                      <span>Autores: </span>
                      <strong className="text-gray-700 dark:text-gray-300">{ext.authors.join(', ')}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{ext.license}</span>
                      <span>•</span>
                      <span>{ext.hooks.length} ganchos</span>
                      {ext.updatedBy && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400" title={`Atualizado por ${ext.updatedBy}`}>
                            Sync: {ext.updatedBy.length > 25 ? `${ext.updatedBy.substring(0, 25)}...` : ext.updatedBy}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Extension Playground & Hooks Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-16 space-y-4">
            {selectedExtension ? (
              <>
                {/* Playground Box */}
                <div className="p-4 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-purple-600" />
                      <span>Simulador Parsoid-TS</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          selectedExtension.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {selectedExtension.isActive ? 'Ativa no Firebase' : 'Desativada'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                      <span>Wikitexto de teste ({selectedExtension.name}):</span>
                      {selectedExtension.exampleWikitext && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlaygroundInput(selectedExtension.exampleWikitext || '');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Restaurar exemplo
                        </button>
                      )}
                    </div>

                    <textarea
                      value={playgroundInput}
                      onChange={e => setPlaygroundInput(e.target.value)}
                      rows={4}
                      className="w-full p-2 font-mono text-xs bg-gray-50 dark:bg-gray-800 border border-[#a2a9b1] dark:border-gray-700 rounded focus:outline-hidden focus:border-purple-600"
                      placeholder="Digite código wikitexto com tags da extensão..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRunPlayground}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium shadow-2xs flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Testar renderização ao vivo</span>
                    </button>

                    <span className="text-[10px] text-gray-500">
                      Motor Parsoid-TS
                    </span>
                  </div>

                  {/* Rendered output */}
                  {renderedHtml && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-gray-400">
                        HTML Gerado pelo Analisador:
                      </span>
                      <div
                        className="p-3 bg-[#fdfdfd] dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded overflow-x-auto text-xs wiki-content"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>
                  )}
                </div>

                {/* Technical Hooks Box */}
                <div className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-xs space-y-3">
                  <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>Detalhes Técnicos & Ganchos</span>
                  </h3>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block mb-0.5">MediaWiki Hooks Registrados:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedExtension.hooks.map(h => (
                          <span
                            key={h}
                            className="px-2 py-0.5 rounded font-mono text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            ${h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Identificador Único (ID):</span>
                      <div className="font-mono text-[10px] text-gray-700 dark:text-gray-300">
                        {selectedExtension.id}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Origem da Instalação:</span>
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        {selectedExtension.installedVia === 'code' ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            Diretório de código TypeScript (/src/extensions/)
                          </span>
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400">
                            Cadastrada por Burocrata via Firebase ({selectedExtension.addedByName || 'Administrador'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Licença:</span>
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        {selectedExtension.license}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                      <a
                        href={selectedExtension.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Documentação no MediaWiki.org</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-gray-500">
                Selecione uma extensão na lista para inspecionar e testar.
              </div>
            )}

            {/* Developer Guide Callout */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <FolderSync className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Como adicionar extensões no diretório:</span>
              </div>
              <p className="leading-relaxed">
                Para registrar uma nova extensão nativa no código, crie um arquivo em <code className="px-1 py-0.2 bg-amber-100 dark:bg-amber-900 rounded font-mono">src/extensions/</code> e exporte no <code className="px-1 py-0.2 bg-amber-100 dark:bg-amber-900 rounded font-mono">index.ts</code>. O sistema detectará o novo arquivo e o sincronizará com o Firebase Firestore automaticamente!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Adicionar Nova Extensão (BUROCRATAS ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-xl w-full p-6 border border-gray-300 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
                  Adicionar Nova Extensão ao Firebase
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExtensionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Extensão: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Interwiki, ShortUrl, UploadWizard..."
                  value={newExtForm.name}
                  onChange={e => setNewExtForm({ ...newExtForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newExtForm.category}
                    onChange={e => setNewExtForm({ ...newExtForm, category: e.target.value as ExtensionCategory })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                  >
                    <option value="parser">Analisador (Parser)</option>
                    <option value="media">Edição & Mídia</option>
                    <option value="admin">Administração & Segurança</option>
                    <option value="skin">Aparência & Skins</option>
                    <option value="api">API & Conectividade</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Versão:
                  </label>
                  <input
                    type="text"
                    placeholder="1.0.0-ts"
                    value={newExtForm.version}
                    onChange={e => setNewExtForm({ ...newExtForm, version: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Descrição Completa: *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explique o funcionamento e propósito desta extensão..."
                  value={newExtForm.description}
                  onChange={e => setNewExtForm({ ...newExtForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Autores (separados por vírgula):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva, MediaWiki Community"
                    value={newExtForm.authors}
                    onChange={e => setNewExtForm({ ...newExtForm, authors: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Licença:
                  </label>
                  <input
                    type="text"
                    placeholder="GPL-2.0-or-later"
                    value={newExtForm.license}
                    onChange={e => setNewExtForm({ ...newExtForm, license: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  URL da Documentação:
                </label>
                <input
                  type="url"
                  placeholder="https://www.mediawiki.org/wiki/Extension:..."
                  value={newExtForm.url}
                  onChange={e => setNewExtForm({ ...newExtForm, url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ganchos (Hooks) utilizados (separados por vírgula):
                </label>
                <input
                  type="text"
                  placeholder="ParserFirstCallInit, PageSaveComplete, BeforePageDisplay"
                  value={newExtForm.hooks}
                  onChange={e => setNewExtForm({ ...newExtForm, hooks: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Wikitexto de Exemplo para o Simulador:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: {{MinhaTag|parametro=valor}}"
                  value={newExtForm.exampleWikitext}
                  onChange={e => setNewExtForm({ ...newExtForm, exampleWikitext: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-hidden focus:border-blue-600 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modalIsActive"
                  checked={newExtForm.isActive}
                  onChange={e => setNewExtForm({ ...newExtForm, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="modalIsActive" className="text-gray-700 dark:text-gray-300 font-medium">
                  Ativar extensão imediatamente no Firebase Firestore
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmittingNew ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando no Firestore...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Cadastrar no Firebase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
