import { ExtensionDefinition } from './types';

export const visualEditorExtension: ExtensionDefinition = {
  id: 'visual-editor',
  name: 'VisualEditor',
  category: 'media',
  version: '0.1.2-ts',
  authors: ['Trevor Parscal', 'Inez Korczyński', 'Roan Kattouw'],
  description: 'Interface de edição WYSWYG moderna com pré-visualização em tempo real e conversão de wikitexto.',
  url: 'https://www.mediawiki.org/wiki/Extension:VisualEditor',
  gitTag: 'REL1_42-ts',
  license: 'MIT',
  hooks: ['CustomEditor', 'BeforePageDisplay'],
  exampleWikitext: 'Edição rica e interativa com barra de ferramentas e formatação instantânea.',
  defaultActive: true,
  installedVia: 'code',
};

export const wikiEditorExtension: ExtensionDefinition = {
  id: 'wiki-editor',
  name: 'WikiEditor',
  category: 'media',
  version: '0.5.1-ts',
  authors: ['Trevor Parscal', 'Roan Kattouw', 'Nimish Gautam'],
  description: 'Barra de ferramentas clássica de edição com assistente de tabelas, busca e substituição e inserção de ligações internas.',
  url: 'https://www.mediawiki.org/wiki/Extension:WikiEditor',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['EditPage::showEditForm:initial'],
  exampleWikitext: "'''Texto em negrito''', ''texto em itálico'' e ligações rápidas [[Página]].",
  defaultActive: true,
  installedVia: 'code',
};

export const uploadWizardExtension: ExtensionDefinition = {
  id: 'upload-wizard',
  name: 'UploadWizard',
  category: 'media',
  version: '2.1.0-ts',
  authors: ['Neil Kandalgaonkar', 'Mark Holmquist', 'Equipe WikiWazzimaGiygg'],
  description: 'Assistente oficial de envio de arquivos e upload de imagens para a wiki. Suporta armazenamento em nuvem e requer o Plano Blaze ativo para transferências.',
  url: 'https://www.mediawiki.org/wiki/Extension:UploadWizard',
  gitTag: 'REL1_42-ts',
  license: 'GPL-2.0-or-later',
  hooks: ['UploadComplete', 'BeforePageDisplay', 'SpecialUpload::execute'],
  exampleWikitext: '[[Ficheiro:Exemplo_logo.png|thumb|Legenda da imagem carregada na wiki]]',
  defaultActive: true,
  installedVia: 'code',
  config: {
    blazePlanEnabled: false,
    maxUploadSizeMB: 10,
    allowedFormats: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'],
  },
};

