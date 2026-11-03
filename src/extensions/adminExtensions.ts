import { ExtensionDefinition } from './types';

export const echoExtension: ExtensionDefinition = {
  id: 'echo',
  name: 'Echo (Notificações)',
  category: 'admin',
  version: '1.2.0-ts',
  authors: ['Andrew Garrett', 'Ryan Kaldari', 'Benny Situ'],
  description: 'Sistema centralizado de notificações e alertas em tempo real sobre menções, reversões e mensagens.',
  url: 'https://www.mediawiki.org/wiki/Extension:Echo',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['BeforePageDisplay', 'PersonalUrls'],
  exampleWikitext: 'Alerta de nova mensagem na página de discussão ou menção @Pedro.',
  defaultActive: true,
  installedVia: 'code',
};

export const checkUserExtension: ExtensionDefinition = {
  id: 'checkuser',
  name: 'CheckUser',
  category: 'admin',
  version: '2.4.0-ts',
  authors: ['Tim Starling', 'Aaron Schulz'],
  description: 'Ferramenta de investigação para burocratas e verificadores auditarem endereços IP e histórico de contas fraudulentas.',
  url: 'https://www.mediawiki.org/wiki/Extension:CheckUser',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['SpecialPage_initList', 'RecentChange_save'],
  exampleWikitext: 'Permite aos burocratas correlacionar edições anônimas e contas múltiplas (sockpuppets).',
  defaultActive: true,
  installedVia: 'code',
};

export const abuseFilterExtension: ExtensionDefinition = {
  id: 'abuse-filter',
  name: 'AbuseFilter (Filtro de Edições)',
  category: 'admin',
  version: '1.3.0-ts',
  authors: ['Andrew Garrett', 'Victor Vasiliev'],
  description: 'Define regras heurísticas automatizadas para prevenir vandalismo, links maliciosos e edições em massa não autorizadas.',
  url: 'https://www.mediawiki.org/wiki/Extension:AbuseFilter',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['EditFilterMergedContent', 'PageSaveComplete'],
  exampleWikitext: 'Bloqueio preventivo de textos contendo padrões de spam ou remoção maciça de conteúdo.',
  defaultActive: true,
  installedVia: 'code',
};
