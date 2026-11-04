import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Info,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiFileDoc } from '../extensions/types';
import { saveUploadedFile, subscribeToUploadedFiles } from '../services/extensionService';

export const SpecialUpload: React.FC = () => {
  const { currentUser, isBureaucrat, isBlazePlanActive, toggleBlazePlan, navigateToPage, loginWithGoogle } = useWiki();

  const [filesList, setFilesList] = useState<WikiFileDoc[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [destFileName, setDestFileName] = useState('');
  const [description, setDescription] = useState('');
  const [license, setLicense] = useState('CC BY-SA 4.0');
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<WikiFileDoc | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activatingBlaze, setActivatingBlaze] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to uploaded files
  useEffect(() => {
    const unsub = subscribeToUploadedFiles(list => {
      setFilesList(list);
      setLoadingFiles(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, GIF, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite máximo permitido de 10 MB.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Auto-generate destination file name
    const rawClean = file.name.replace(/\s+/g, '_');
    setDestFileName(rawClean);

    // Read preview & dimensions
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setPreviewUrl(dataUrl);

      const img = new window.Image();
      img.onload = () => {
        setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      const fakeEvent = {
        target: fileInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !previewUrl) {
      setUploadError('Selecione uma imagem para enviar.');
      return;
    }
    if (!destFileName.trim()) {
      setUploadError('Informe o nome de destino do ficheiro.');
      return;
    }

    if (!isBlazePlanActive) {
      setUploadError('O Plano Blaze não está ativado nas configurações da extensão. Ative-o antes de enviar.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const docResult = await saveUploadedFile({
        fileName: destFileName.trim(),
        dataUrl: previewUrl,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        description: description.trim(),
        license,
        author: currentUser.username,
        authorId: currentUser.uid,
        width: fileDimensions?.width,
        height: fileDimensions?.height,
      });

      setUploadedResult(docResult);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDestFileName('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading wiki file:', err);
      setUploadError(err.message || 'Falha ao salvar a imagem no Firestore.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyWikitext = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleActivateBlazeFromBanner = async () => {
    if (!isBureaucrat) return;
    setActivatingBlaze(true);
    try {
      await toggleBlazePlan(true);
    } catch (err: any) {
      alert('Erro ao ativar Plano Blaze: ' + (err.message || String(err)));
    } finally {
      setActivatingBlaze(false);
    }
  };

  return (
    <div className="py-2 space-y-6 text-xs">
      {/* Title Header */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Carregar ficheiro / imagem</span>
          </h1>

          <div className="flex items-center gap-2">
            {isBlazePlanActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                <span>Plano Blaze Ativado na Extensão</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Desativado (Requer Plano Blaze)</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center justify-between gap-2">
          <span>
            Ferramenta canônica do MediaWiki (<code>Special:Upload</code>) para envio de imagens, ilustrações e fotos para a wiki.
          </span>
          <span className="font-mono text-blue-700 dark:text-blue-300">
            Especial:Carregar_arquivo
          </span>
        </div>
      </div>

      {/* BLAZE PLAN DISABLED NOTICE (WHEN INACTIVE) */}
      {!isBlazePlanActive && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-lg shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-full text-orange-600 shrink-0 mt-0.5">
              <Flame className="w-6 h-6 fill-orange-500 text-orange-600" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>Upload de Imagem Condicionado ao Plano Blaze</span>
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                A opção de carregamento de arquivos e imagens na <strong>WikiWazzimaGiygg</strong> está desativada porque o <strong>Plano Blaze</strong> não está ativado nas configurações da extensão <strong>UploadWizard</strong>.
              </p>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                O Google Cloud / Firebase exige o plano Blaze para operações de armazenamento de mídias externas. Assim que ativado nas configurações da extensão, o upload é liberado instantaneamente em todo o site.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-3">
            {isBureaucrat ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activatingBlaze}
                  onClick={handleActivateBlazeFromBanner}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  <span>{activatingBlaze ? 'Ativando no Firebase...' : 'Ativar Plano Blaze na Extensão Agora'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToPage('Especial:Extensões')}
                  className="px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ver Extensão UploadWizard</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>Solicite a um burocrata para ativar o Plano Blaze em <strong>Especial:Extensões</strong>.</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigateToPage('Especial:Extensões')}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium text-xs"
            >
              <span>Gerenciar Extensões da Wiki</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS UPLOAD NOTICE */}
      {uploadedResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Arquivo "{uploadedResult.fileName}" carregado com sucesso!</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadedResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3 h-28 bg-white dark:bg-black p-1 border border-emerald-200 dark:border-emerald-800 rounded flex items-center justify-center overflow-hidden">
              <img
                src={uploadedResult.url}
                alt={uploadedResult.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="md:col-span-9 space-y-2">
              <p className="text-gray-700 dark:text-gray-300 text-xs">
                Para inserir esta imagem em qualquer artigo da WikiWazzimaGiygg, copie o wikitexto abaixo e cole no editor:
              </p>

              <div className="flex items-center gap-2">
                <code className="p-2 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-800 rounded font-mono text-xs flex-1 select-all text-gray-900 dark:text-gray-100">
                  {`[[${uploadedResult.title}|thumb|${uploadedResult.description || uploadedResult.fileName}]]`}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyWikitext(
                      `[[${uploadedResult.title}|thumb|${uploadedResult.description || uploadedResult.fileName}]]`
                    )
                  }
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedSnippet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSnippet ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => navigateToPage(uploadedResult.id)}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Abrir página do ficheiro ({uploadedResult.title})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD FORM (ACTIVE ONLY WHEN BLAZE PLAN IS ENABLED) */}
      {isBlazePlanActive && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload Form */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Enviar Nova Imagem</span>
            </h2>

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Dropzone Area */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  previewUrl
                    ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-2">
                    <div className="max-h-48 flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-44 max-w-full object-contain rounded border border-gray-200 dark:border-gray-700 shadow-2xs"
                      />
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <span>{selectedFile?.name}</span>
                      {fileDimensions && (
                        <span className="text-gray-500 ml-2">
                          ({fileDimensions.width} × {fileDimensions.height} px, {((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-blue-600 hover:underline">
                      Clique para trocar de arquivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Image className="w-6 h-6" />
                    </div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      Arraste uma imagem aqui ou clique para selecionar
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Formatos aceitos: PNG, JPG, GIF, SVG, WebP (Máximo 10 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Destination file name */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Ficheiro de Destino (Título canônico da imagem) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono text-xs">
                    Ficheiro:
                  </span>
                  <input
                    type="text"
                    required
                    value={destFileName}
                    onChange={e => setDestFileName(e.target.value.replace(/^Ficheiro:/i, ''))}
                    placeholder="Exemplo_Logo.png"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-r p-2 text-xs text-gray-900 dark:text-gray-100 font-mono"
                  />
                </div>
              </div>

              {/* Description and metadata */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Sumário / Descrição do Ficheiro
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o que a imagem representa, contexto ou legenda..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* License select */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Licença e Direitos Autorais
                </label>
                <select
                  value={license}
                  onChange={e => setLicense(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-xs text-gray-900 dark:text-gray-100"
                >
                  <option value="CC BY-SA 4.0">Creative Commons Atribuição-CompartilhaIgual 4.0 (CC BY-SA 4.0)</option>
                  <option value="Domínio Público">Domínio Público (Obra livre / Isenta de direitos)</option>
                  <option value="GNU Free Documentation License">GNU Free Documentation License (GFDL)</option>
                  <option value="Uso Justo / Fair Use">Uso Justo / Marca Registrada (Fins enciclopédicos)</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
                <div className="text-[11px] text-gray-500">
                  Enviando como: <strong>{currentUser.username}</strong>
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className={`px-4 py-2 rounded font-medium text-xs flex items-center gap-2 shadow-2xs ${
                    isUploading || !selectedFile
                      ? 'bg-gray-300 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-[#3366cc] hover:bg-[#254b99] text-white cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Gravando no Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Carregar ficheiro na wiki</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Instructions & MediaWiki Standards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Instruções de Uso de Imagens</span>
              </h3>

              <div className="space-y-2 text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Após carregar um ficheiro, ele ganha uma página própria no namespace <code>Ficheiro:</code> e pode ser incorporado instantaneamente em qualquer artigo:
                </p>

                <div className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono text-[11px] space-y-1">
                  <div className="text-gray-400">// Imagem simples com miniatura e legenda:</div>
                  <div className="text-purple-700 dark:text-purple-300 font-bold">
                    {'[[Ficheiro:Nome.png|thumb|Legenda]]'}
                  </div>
                  <div className="text-gray-400 pt-1">// Com alinhamento à esquerda ou direita:</div>
                  <div className="text-blue-700 dark:text-blue-300">
                    {'[[Ficheiro:Nome.png|thumb|left|Legenda]]'}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">Status do Sistema:</div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>UploadWizard ativo via Plano Blaze no Firebase</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Link to Extensions settings */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded text-[11px] flex items-center justify-between gap-2">
              <span className="text-blue-950 dark:text-blue-200">
                Deseja configurar limites ou opções da extensão UploadWizard?
              </span>
              <button
                type="button"
                onClick={() => navigateToPage('Especial:Extensões')}
                className="text-blue-700 dark:text-blue-300 font-bold hover:underline shrink-0 flex items-center gap-1"
              >
                <span>Configurar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT UPLOADED MEDIA GALLERY */}
      <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-600" />
            <span>Ficheiros e Imagens Carregados na Wiki ({filesList.length})</span>
          </h2>
          <span className="text-[11px] text-gray-500">
            Sincronizados em tempo real do Firestore (/wiki_files)
          </span>
        </div>

        {loadingFiles ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
            <span>Carregando galeria de ficheiros...</span>
          </div>
        ) : filesList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700">
            <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium text-sm text-gray-700 dark:text-gray-300">Nenhum ficheiro carregado ainda</p>
            <p className="text-[11px] mt-1">
              {isBlazePlanActive
                ? 'Seja o primeiro a carregar uma imagem utilizando o formulário acima!'
                : 'Ative o Plano Blaze nas configurações da extensão para liberar o carregamento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filesList.map(file => (
              <div
                key={file.id}
                onClick={() => navigateToPage(file.id)}
                className="group bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 rounded p-2 text-center cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="h-28 w-full bg-white dark:bg-black rounded flex items-center justify-center overflow-hidden mb-1.5 p-1 border border-gray-200 dark:border-gray-800">
                  <img
                    src={file.url}
                    alt={file.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="space-y-0.5">
                  <div
                    className="font-bold text-[11px] text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600"
                    title={file.title}
                  >
                    {file.fileName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {(file.size / 1024).toFixed(0)} KB • {new Date(file.timestamp).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
