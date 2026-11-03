import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { CODEBASE_EXTENSIONS, ExtensionDefinition, WikiExtensionDoc } from '../extensions';
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
          updatedAt: new Date().toISOString(),
          updatedBy: 'Sincronizador Automático de Diretório (/src/extensions)',
        };

        await setDoc(docRef, newDoc);
        newlySynced++;
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
