import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { CODEBASE_EXTENSIONS, ExtensionDefinition, WikiExtensionDoc, WikiFileDoc } from '../extensions';
import { slugify } from '../core/parser';

export const WIKI_EXTENSIONS_COLLECTION = 'wiki_extensions';

let isSyncing = false;

/**
 * Sincroniza extensões adicionadas no diretório de código (/src/extensions)
 * para o banco de dados Firebase Firestore.
 * 
 * Se uma nova extensão for criada nos arquivos TypeScript, ela é automaticamente
 * inserida no Firestore. Se ela já existir no Firestore, o estado definido
 * pelo Burocrata (ativo/inativo) é respeitado e preservado!
 */
export async function syncCodebaseExtensionsToFirestore(): Promise<{
  syncedCount: number;
  totalCodebase: number;
}> {
  if (isSyncing) {
    return { syncedCount: 0, totalCodebase: CODEBASE_EXTENSIONS.length };
  }
  isSyncing = true;

  try {
    const colRef = collection(db, WIKI_EXTENSIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const existingDocIds = new Set<string>();
    snapshot.forEach(docSnap => {
      existingDocIds.add(docSnap.id);
    });

    let newlySynced = 0;

    for (const ext of CODEBASE_EXTENSIONS) {
      if (!existingDocIds.has(ext.id)) {
        // Nova extensão encontrada nos diretórios do código! Sincronizar para o Firestore
        const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, ext.id);
        const newDoc: WikiExtensionDoc = {
          id: ext.id,
          name: ext.name,
          category: ext.category,
          version: ext.version,
          authors: ext.authors,
          description: ext.description,
          url: ext.url,
          gitTag: ext.gitTag,
          license: ext.license,
          hooks: ext.hooks,
          exampleWikitext: ext.exampleWikitext,
          isActive: ext.defaultActive,
          installedVia: 'code',
          config: ext.config || {},
          updatedAt: new Date().toISOString(),
          updatedBy: 'Sincronizador Automático de Diretório (/src/extensions)',
        };

        await setDoc(docRef, newDoc);
        newlySynced++;
      } else {
        // If extension already exists in Firestore but has default config defined in codebase and missing remotely, merge config
        if (ext.config) {
          const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, ext.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as WikiExtensionDoc;
            if (!data.config) {
              await setDoc(docRef, { config: ext.config }, { merge: true });
            }
          }
        }
      }
    }

    return { syncedCount: newlySynced, totalCodebase: CODEBASE_EXTENSIONS.length };
  } catch (error) {
    console.warn('Erro ao sincronizar extensões do diretório para o Firestore:', error);
    return { syncedCount: 0, totalCodebase: CODEBASE_EXTENSIONS.length };
  } finally {
    isSyncing = false;
  }
}

/**
 * Inscrição em tempo real para a coleção de extensões no Firestore.
 * Qualquer alteração realizada por um burocrata reflete instantaneamente
 * em todas as sessões abertas.
 */
export function subscribeToExtensions(
  callback: (extensions: WikiExtensionDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, WIKI_EXTENSIONS_COLLECTION);

  return onSnapshot(
    colRef,
    snapshot => {
      const list: WikiExtensionDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as WikiExtensionDoc);
      });
      // Ordenação padrão: por categoria e depois por nome
      list.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
      callback(list);
    },
    error => {
      console.error('Erro na subscrição em tempo real de wiki_extensions:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Ativar ou desativar uma extensão no Firebase Firestore.
 * ESTRITAMENTE RESTRITO A BUROCRATAS.
 */
export async function toggleExtensionActiveInFirestore(
  extensionId: string,
  isActive: boolean,
  isBureaucrat: boolean,
  username: string
): Promise<void> {
  if (!isBureaucrat) {
    throw new Error('Apenas burocratas têm permissão para ativar ou desativar extensões na WikiWazzimaGiygg.');
  }

  const docPath = `${WIKI_EXTENSIONS_COLLECTION}/${extensionId}`;
  try {
    const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, extensionId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: username,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Adicionar uma nova extensão personalizada no Firebase Firestore.
 * ESTRITAMENTE RESTRITO A BUROCRATAS.
 */
export async function createBureaucratExtension(
  extensionData: {
    name: string;
    category: WikiExtensionDoc['category'];
    version: string;
    authors: string[];
    description: string;
    url: string;
    gitTag?: string;
    license: string;
    hooks: string[];
    exampleWikitext?: string;
    isActive: boolean;
  },
  isBureaucrat: boolean,
  bureaucratUid: string,
  bureaucratName: string
): Promise<WikiExtensionDoc> {
  if (!isBureaucrat) {
    throw new Error('Apenas burocratas têm permissão para instalar e registrar novas extensões.');
  }

  const rawId = slugify(extensionData.name.toLowerCase().trim()) || `ext-${Date.now()}`;
  const id = rawId.startsWith('ext-') ? rawId : `ext-${rawId}`;
  const docPath = `${WIKI_EXTENSIONS_COLLECTION}/${id}`;

  try {
    const newDoc: WikiExtensionDoc = {
      ...extensionData,
      id,
      installedVia: 'bureaucrat',
      addedByUid: bureaucratUid,
      addedByName: bureaucratName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: bureaucratName,
    };

    const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, id);
    await setDoc(docRef, newDoc);
    return newDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

/**
 * Excluir uma extensão instalada por burocrata no Firebase.
 * ESTRITAMENTE RESTRITO A BUROCRATAS.
 */
export async function deleteBureaucratExtension(
  extensionId: string,
  isBureaucrat: boolean
): Promise<void> {
  if (!isBureaucrat) {
    throw new Error('Apenas burocratas têm autorização para remover extensões do sistema.');
  }

  const docPath = `${WIKI_EXTENSIONS_COLLECTION}/${extensionId}`;
  try {
    const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, extensionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return;
    }
    const data = snap.data() as WikiExtensionDoc;
    if (data.installedVia === 'code') {
      throw new Error('Extensões originadas do diretório do código (/src/extensions) não podem ser deletadas, apenas desativadas.');
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Atualiza o objeto de configurações (config) de uma extensão no Firestore.
 * Utilizado por burocratas para configurar opções como o Plano Blaze ($wgUploadWizardConfig).
 */
export async function updateExtensionConfigInFirestore(
  extensionId: string,
  newConfig: Record<string, any>,
  isBureaucrat: boolean,
  username: string
): Promise<void> {
  if (!isBureaucrat) {
    throw new Error('Apenas burocratas podem alterar as configurações de extensões.');
  }

  const docPath = `${WIKI_EXTENSIONS_COLLECTION}/${extensionId}`;
  try {
    const docRef = doc(db, WIKI_EXTENSIONS_COLLECTION, extensionId);
    await setDoc(
      docRef,
      {
        config: newConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: username,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/**
 * Verifica se o Plano Blaze está ativado nas configurações da extensão UploadWizard
 * (ou em qualquer extensão ativa do Wiki-site que possua a flag blazePlanEnabled).
 */
export function isBlazePlanActiveInExtensions(extensions: WikiExtensionDoc[]): boolean {
  if (!extensions || extensions.length === 0) return false;

  // 1. Procurar prioritariamente pela extensão UploadWizard
  const uploadWizard = extensions.find(e => e.id === 'upload-wizard');
  if (uploadWizard && uploadWizard.isActive) {
    if (uploadWizard.config && Boolean(uploadWizard.config.blazePlanEnabled)) {
      return true;
    }
  }

  // 2. Se qualquer outra extensão ativa possuir explicitamente blazePlanEnabled: true
  const anyBlazeExt = extensions.find(
    e => e.isActive && e.config && Boolean(e.config.blazePlanEnabled)
  );
  return Boolean(anyBlazeExt);
}

// ========================================================================
// REPOSITÓRIO DE ARQUIVOS E IMAGENS DA WIKI (wiki_files)
// ========================================================================
export const WIKI_FILES_COLLECTION = 'wiki_files';

export async function saveUploadedFile(params: {
  fileName: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  description: string;
  license?: string;
  author: string;
  authorId: string;
  width?: number;
  height?: number;
}): Promise<WikiFileDoc> {
  const cleanName = params.fileName.trim().replace(/\s+/g, '_');
  const fileTitle = cleanName.startsWith('Ficheiro:') || cleanName.startsWith('File:')
    ? cleanName
    : `Ficheiro:${cleanName}`;
  const fileId = slugify(fileTitle);

  const fileDoc: WikiFileDoc = {
    id: fileId,
    title: fileTitle,
    fileName: cleanName.replace(/^(Ficheiro:|File:)/i, ''),
    url: params.dataUrl,
    mimeType: params.mimeType,
    size: params.size,
    uploadedBy: params.author,
    uploadedByUid: params.authorId,
    description: params.description.trim() || 'Imagem carregada na wiki via UploadWizard',
    license: params.license || 'CC BY-SA 4.0 / Domínio Público',
    timestamp: new Date().toISOString(),
    width: params.width,
    height: params.height,
  };

  const docRef = doc(db, WIKI_FILES_COLLECTION, fileId);
  await setDoc(docRef, fileDoc);

  // Também criar a página canônica no namespace File em wiki_pages para que a página da imagem exista e seja visualizável!
  const pageDocRef = doc(db, 'wiki_pages', fileId);
  const pageContent = `== Resumo do Ficheiro ==
${params.description || "Arquivo de mídia carregado na wiki."}

{| class="wikitable" style="width:100%; max-width:540px;"
! Detalhe !! Informação
|-
| '''Nome do Arquivo''' || <code>${fileDoc.fileName}</code>
|-
| '''Tipo de Mídia''' || ${fileDoc.mimeType}
|-
| '''Tamanho''' || ${(fileDoc.size / 1024).toFixed(1)} KB
|-
| '''Carregado por''' || [[Usuário:${params.author}|${params.author}]]
|-
| '''Licença''' || ${fileDoc.license}
|-
| '''Data de Envio''' || ${new Date().toLocaleDateString('pt-BR')}
|}

== Como Usar Este Ficheiro ==
Para incorporar este ficheiro em qualquer artigo da wiki, utilize a sintaxe:
<syntaxhighlight lang="text">
[[${fileTitle}|thumb|Legenda da imagem]]
</syntaxhighlight>

[[Categoria:Ficheiros_da_Wiki]]
[[Categoria:Mídias_Carregadas]]`;

  await setDoc(
    pageDocRef,
    {
      slug: fileId,
      title: fileTitle,
      namespace: 'File',
      content: pageContent,
      summary: `Carregamento de nova imagem: ${fileDoc.fileName}`,
      author: params.author,
      authorId: params.authorId,
      revisionCount: 1,
      latestRevisionId: `rev_upload_${Date.now()}`,
      categories: ['Ficheiros_da_Wiki', 'Mídias_Carregadas'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return fileDoc;
}

export function subscribeToUploadedFiles(
  callback: (files: WikiFileDoc[]) => void,
  maxCount = 60
): Unsubscribe {
  const colRef = collection(db, WIKI_FILES_COLLECTION);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    snapshot => {
      const files: WikiFileDoc[] = [];
      snapshot.forEach(docSnap => {
        const file = docSnap.data() as WikiFileDoc;
        files.push(file);
        if (file.url) {
          cacheFileUrl(file.fileName, file.url);
          cacheFileUrl(file.title, file.url);
          cacheFileUrl(file.id, file.url);
        }
      });
      callback(files);
    },
    error => {
      console.warn('Erro ao carregar lista de arquivos:', error);
      callback([]);
    }
  );
}

// Global in-memory cache of file URLs so parser and articles can resolve filenames to data URLs
const fileUrlMemoryCache = new Map<string, string>();

export function cacheFileUrl(key: string, url: string): void {
  if (!key || !url) return;
  const lower = key.toLowerCase();
  const stripped = lower.replace(/^(ficheiro:|file:|imagem:|image:)/i, '').replace(/_/g, ' ').trim();
  fileUrlMemoryCache.set(lower, url);
  fileUrlMemoryCache.set(lower.replace(/ /g, '_'), url);
  fileUrlMemoryCache.set(stripped, url);
  fileUrlMemoryCache.set(stripped.replace(/ /g, '_'), url);
}

export function getCachedFileUrl(nameOrSlug: string): string | undefined {
  if (!nameOrSlug) return undefined;
  const lower = nameOrSlug.toLowerCase();
  const stripped = lower.replace(/^(ficheiro:|file:|imagem:|image:)/i, '').replace(/_/g, ' ').trim();
  return (
    fileUrlMemoryCache.get(lower) ||
    fileUrlMemoryCache.get(lower.replace(/ /g, '_')) ||
    fileUrlMemoryCache.get(stripped) ||
    fileUrlMemoryCache.get(stripped.replace(/ /g, '_'))
  );
}

export async function getFileDoc(idOrTitle: string): Promise<WikiFileDoc | null> {
  try {
    const cleanId = slugify(idOrTitle);
    const docRef = doc(db, WIKI_FILES_COLLECTION, cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as WikiFileDoc;
      if (data.url) {
        cacheFileUrl(data.fileName, data.url);
        cacheFileUrl(data.title, data.url);
        cacheFileUrl(data.id, data.url);
      }
      return data;
    }
  } catch (err) {
    console.warn(`Erro ao buscar ficheiro ${idOrTitle}:`, err);
  }
  return null;
}

