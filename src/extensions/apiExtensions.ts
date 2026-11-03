import { ExtensionDefinition } from './types';

export const actionApiExtension: ExtensionDefinition = {
  id: 'action-api',
  name: 'Action API (api.php compatível)',
  category: 'api',
  version: '2.0.0-ts',
  authors: ['Roan Kattouw', 'Victor Vasiliev', 'MediaWiki Core'],
  description: 'Endpoint REST e JSON simulando a API nativa do MediaWiki com suporte a consultas por título, categoria e dados de revisão.',
  url: 'https://www.mediawiki.org/wiki/API:Main_page',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['APIQueryAfterExecute'],
  exampleWikitext: 'Permite bots e integrações externas consumirem endpoints como ?action=query&prop=info.',
  defaultActive: true,
  installedVia: 'code',
};

export const graphQlApiExtension: ExtensionDefinition = {
  id: 'graphql-api',
  name: 'GraphQL API & Realtime Webhooks',
  category: 'api',
  version: '1.0.0-ts',
  authors: ['MediaWiki TS Architecture Team'],
  description: 'Mecanismo de consultas tipadas sobre artigos e sincronização de eventos de edição em tempo real com o Firebase Firestore.',
  url: 'https://www.mediawiki.org/wiki/API:REST_API',
  gitTag: 'REL1_42-ts',
  license: 'MIT',
  hooks: ['BeforePageSave', 'PageSaveComplete'],
  exampleWikitext: 'Consulta reativa para clientes e sincronizador de bancos Firestore.',
  defaultActive: true,
  installedVia: 'code',
};
