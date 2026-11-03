export type ExtensionCategory = 'parser' | 'media' | 'admin' | 'skin' | 'api';

export type ExtensionOrigin = 'code' | 'bureaucrat';

export interface ExtensionDefinition {
  id: string;
  name: string;
  category: ExtensionCategory;
  version: string;
  authors: string[];
  description: string;
  url: string;
  gitTag?: string;
  license: string;
  hooks: string[];
  exampleWikitext?: string;
  defaultActive: boolean;
  installedVia?: ExtensionOrigin;
}

export interface WikiExtensionDoc {
  id: string;
  name: string;
  category: ExtensionCategory;
  version: string;
  authors: string[];
  description: string;
  url: string;
  gitTag?: string;
  license: string;
  hooks: string[];
  exampleWikitext?: string;
  isActive: boolean;
  installedVia: ExtensionOrigin;
  addedByUid?: string;
  addedByName?: string;
  createdAt?: string;
  updatedAt: string;
  updatedBy?: string;
}
