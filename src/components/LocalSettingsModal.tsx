import React, { useState } from 'react';
import { Sliders, X, Check, Code, Save, RotateCcw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiSkin } from '../types/wiki';

interface LocalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalSettingsModal: React.FC<LocalSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, skin, setSkin } = useWiki();

  const [sitename, setSitename] = useState(settings.sitename);
  const [languageCode, setLanguageCode] = useState(settings.languageCode);
  const [allowAnon, setAllowAnon] = useState(settings.allowAnonymousEditing);
  const [livePreview, setLivePreview] = useState(settings.enableLivePreview);
  const [selectedSkin, setSelectedSkin] = useState<WikiSkin>(skin);
  const [savedAlert, setSavedAlert] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      sitename,
      languageCode,
      allowAnonymousEditing: allowAnon,
      enableLivePreview: livePreview,
      defaultSkin: selectedSkin,
    });
    setSkin(selectedSkin);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 600);
  };

  const codeRepresentation = `// LocalSettings.ts - MediaWiki TS Configuration
import { WikiSettings } from './types/wiki';

export const config: WikiSettings = {
  sitename: "${sitename}",
  languageCode: "${languageCode}",
  allowAnonymousEditing: ${allowAnon},
  enableLivePreview: ${livePreview},
  defaultSkin: "${selectedSkin}",
  maxRecentChanges: 50,
  repositoryUrl: "https://github.com/wikimedia/mediawiki"
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3">
      <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg shadow-xl max-w-xl w-full text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100">
              Configurações da Wiki (LocalSettings.ts)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {savedAlert && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Configurações salvas e aplicadas em tempo real!</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              $wgSitename (Nome da Wiki):
            </label>
            <input
              type="text"
              required
              value={sitename}
              onChange={e => setSitename(e.target.value)}
              className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                $wgLanguageCode:
              </label>
              <select
                value={languageCode}
                onChange={e => setLanguageCode(e.target.value)}
                className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs"
              >
                <option value="pt-br">pt-br (Português do Brasil)</option>
                <option value="pt">pt (Português de Portugal)</option>
                <option value="en">en (English)</option>
                <option value="es">es (Español)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                $wgDefaultSkin:
              </label>
              <select
                value={selectedSkin}
                onChange={e => setSelectedSkin(e.target.value as WikiSkin)}
                className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs"
              >
                <option value="vector-modern">Vector Moderno (2022)</option>
                <option value="vector-legacy">Vector Clássico (2010)</option>
                <option value="dark-mode">Modo Escuro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allowAnon}
                onChange={e => setAllowAnon(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>$wgGroupPermissions[&apos;*&apos;][&apos;edit&apos;] (Permitir edições de anônimos)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={livePreview}
                onChange={e => setLivePreview(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>$wgLivePreview (Habilitar previsão ao vivo)</span>
            </label>
          </div>

          {/* Live TypeScript Code Preview */}
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-gray-500 mb-1">
              <Code className="w-3.5 h-3.5" />
              <span>Visualização do código LocalSettings.ts:</span>
            </div>
            <pre className="p-3 bg-gray-950 text-emerald-400 font-mono text-[11px] rounded overflow-x-auto border border-gray-800 leading-relaxed">
              {codeRepresentation}
            </pre>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-700 dark:text-gray-300 rounded cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
