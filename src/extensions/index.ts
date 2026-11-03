import { ExtensionDefinition } from './types';
import {
  parserFunctionsExtension,
  citeExtension,
  mathExtension,
  syntaxHighlightExtension,
  scribuntoExtension,
  dynamicPageListExtension,
} from './parserExtensions';
import { visualEditorExtension, wikiEditorExtension } from './mediaExtensions';
import { echoExtension, checkUserExtension, abuseFilterExtension } from './adminExtensions';
import {
  vectorModernSkinExtension,
  timelessSkinExtension,
  mobileFrontendExtension,
} from './skinExtensions';
import { actionApiExtension, graphQlApiExtension } from './apiExtensions';

/**
 * ========================================================================
 * REGISTRO CENTRAL DE EXTENSÕES DO CÓDIGO (src/extensions)
 * ========================================================================
 * Qualquer extensão adicionada neste diretório ou exportada aqui é
 * automaticamente detectada pelo sincronizador e espelhada no Firebase Firestore.
 * 
 * Se você criar um novo arquivo `src/extensions/minhaExtensao.ts`, basta
 * adicioná-la a esta lista `CODEBASE_EXTENSIONS`. No próximo carregamento,
 * a extensão será registrada no Firebase automaticamente!
 */
export const CODEBASE_EXTENSIONS: ExtensionDefinition[] = [
  // Analisadores / Parsers
  parserFunctionsExtension,
  citeExtension,
  mathExtension,
  syntaxHighlightExtension,
  scribuntoExtension,
  dynamicPageListExtension,

  // Mídia e Edição
  visualEditorExtension,
  wikiEditorExtension,

  // Administração e Segurança
  echoExtension,
  checkUserExtension,
  abuseFilterExtension,

  // Temas e Skins
  vectorModernSkinExtension,
  timelessSkinExtension,
  mobileFrontendExtension,

  // APIs e Conectividade
  actionApiExtension,
  graphQlApiExtension,
];

export function getCodebaseExtensions(): ExtensionDefinition[] {
  return [...CODEBASE_EXTENSIONS];
}

export * from './types';
