import { ExtensionDefinition } from './types';

export const vectorModernSkinExtension: ExtensionDefinition = {
  id: 'skin-vector-2022',
  name: 'Skin: Vector Moderno (2022)',
  category: 'skin',
  version: '1.42.0-ts',
  authors: ['Wikimedia Design Team', 'MediaWiki Web Team'],
  description: 'O tema padrão do MediaWiki e da Wikipédia moderna, com tipografia aprimorada, índice fixo retrátil e layout flexível.',
  url: 'https://www.mediawiki.org/wiki/Skin:Vector/2022',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['SkinTemplateNavigation::Universal', 'SkinPageReady'],
  exampleWikitext: 'Layout responsivo padrão da WikiWazzimaGiygg com suporte a abas de histórico e edição.',
  defaultActive: true,
  installedVia: 'code',
};

export const timelessSkinExtension: ExtensionDefinition = {
  id: 'skin-timeless',
  name: 'Skin: Timeless',
  category: 'skin',
  version: '1.0.0-ts',
  authors: ['Isarra Yos', 'MediaWiki Community'],
  description: 'Tema responsivo de alta densidade visual inspirado no clássico monobook com suporte a telas grandes e celulares.',
  url: 'https://www.mediawiki.org/wiki/Skin:Timeless',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['SkinTemplateNavigation'],
  exampleWikitext: 'Visual clássico de duas colunas com navegação direta.',
  defaultActive: false,
  installedVia: 'code',
};

export const mobileFrontendExtension: ExtensionDefinition = {
  id: 'mobile-frontend',
  name: 'MobileFrontend (Minerva)',
  category: 'skin',
  version: '2.3.0-ts',
  authors: ['Patrick Reilly', 'Max Semenik', 'Jon Robson'],
  description: 'Otimização móvel para visualização ultrarrápida em smartphones e conexões de baixa largura de banda.',
  url: 'https://www.mediawiki.org/wiki/Extension:MobileFrontend',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['EnterMobileMode', 'BeforePageDisplayMobile'],
  exampleWikitext: 'Renderização colapsável de seções com carregamento sob demanda.',
  defaultActive: true,
  installedVia: 'code',
};
