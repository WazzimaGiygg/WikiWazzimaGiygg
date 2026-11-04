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
  config?: Record<string, any>;
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
  config?: Record<string, any>;
}

export interface WikiFileDoc {
  id: string;
  title: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedByUid: string;
  description: string;
  license: string;
  timestamp: string;
  width?: number;
  height?: number;
}

