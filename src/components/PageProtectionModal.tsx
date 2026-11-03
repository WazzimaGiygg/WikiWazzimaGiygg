import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  X,
  CheckCircle2,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { WikiPage, PageProtectionLevel } from '../types/wiki';
import { useWiki } from '../context/WikiContext';
import {
  setPageProtection,
  isPageProtectionActive,
  getEffectiveProtectionLevel,
} from '../services/wikiService';

interface PageProtectionModalProps {
  page: WikiPage;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedPage?: WikiPage) => void;
}

const PRESET_REASONS = [
  'Página de sistema altamente visível (ex: Página Principal)',
  'Prevenção contra vandalismo excessivo ou repetitivo',
  'Guerra de edições recorrente entre colaboradores',
  'Artigo ou manual técnico protegido pela administração',
  'Conteúdo sensível ou termo institucional',
  'Outro motivo personalizado',
];

const EXPIRY_OPTIONS = [
  { label: 'Indefinida / Permanente', value: 'infinity' },
  { label: '1 dia (24 horas)', value: '1_day' },
  { label: '3 dias', value: '3_days' },
  { label: '1 semana (7 dias)', value: '1_week' },
  { label: '1 mês (30 dias)', value: '1_month' },
  { label: '3 meses (90 dias)', value: '3_months' },
];

export const PageProtectionModal: React.FC<PageProtectionModalProps> = ({
  page,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser } = useWiki();

  const currentLevel = getEffectiveProtectionLevel(page);
  const isActive = isPageProtectionActive(page);

  const [selectedLevel, setSelectedLevel] = useState<PageProtectionLevel>(currentLevel);
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>(page.protectionReason || '');
  const [expirySelection, setExpirySelection] = useState<string>('infinity');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const canManage = currentUser.isBureaucrat || currentUser.isAdmin;

  const calculateExpiryDate = (selection: string): string => {
    if (selection === 'infinity') return 'infinity';
    const now = new Date();
    switch (selection) {
      case '1_day':
        now.setDate(now.getDate() + 1);
        break;
      case '3_days':
        now.setDate(now.getDate() + 3);
        break;
      case '1_week':
        now.setDate(now.getDate() + 7);
        break;
      case '1_month':
        now.setMonth(now.getMonth() + 1);
        break;
      case '3_months':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        return 'infinity';
    }
    return now.toISOString();
  };

  const handleSaveProtection = async () => {
    if (!canManage) {
      setErrorMsg('Apenas burocratas e administradores podem configurar o nível de proteção.');
      return;
    }

    const finalReason =
      selectedLevel === 'unprotected'
        ? ''
        : customReason.trim() || (selectedPreset !== 'Outro motivo personalizado' ? selectedPreset : 'Sem motivo');

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const calculatedExpiry = calculateExpiryDate(expirySelection);

      await setPageProtection({
        pageSlug: page.slug,
        pageTitle: page.title,
        level: selectedLevel,
        reason: finalReason,
        expiry: calculatedExpiry,
        bureaucrat: {
          uid: currentUser.uid,
          username: currentUser.username,
        },
      });

      setSuccessMsg(`Nível de proteção atualizado com sucesso para [${selectedLevel}] no Firestore!`);
      setTimeout(() => {
        if (onUpdated) onUpdated();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error setting protection level:', err);
      setErrorMsg(err.message || 'Erro ao gravar nível de proteção no Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3">
      <div className="bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded-lg shadow-xl max-w-xl w-full text-xs overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#eaecf0] dark:bg-gray-800 border-b border-[#a2a9b1] dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-serif font-bold text-sm text-gray-900 dark:text-gray-100">
              Nível de Proteção da Página: <span className="underline decoration-blue-500">{page.title}</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Current Status Box */}
          <div className="p-3 rounded border border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-800/60">
            <div className="text-[11px] text-gray-500 uppercase font-semibold mb-1">
              Estado Atual no Firestore
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentLevel === 'locked' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloqueada (Totalmente Protegida)</span>
                  </span>
                ) : currentLevel === 'semi_protected' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Semiprotegida</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Desprotegida (Edição Livre para Autenticados)</span>
                  </span>
                )}
              </div>

              {page.protectedAt && (
                <div className="text-[10px] text-gray-500 text-right">
                  Protegida em: {new Date(page.protectedAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>

            {page.protectionReason && (
              <div className="mt-2 text-[11px] text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                <span className="font-semibold">Motivo registrado:</span> {page.protectionReason}
                {page.protectedBy && (
                  <span className="text-gray-500 text-[10px] block mt-0.5">
                    Definido por: {page.protectedBy}
                  </span>
                )}
              </div>
            )}
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form to change protection */}
          {canManage ? (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Selecione o Nível de Proteção de Edição:
                </label>
                <div className="space-y-2">
                  {/* Option 1: Unprotected */}
                  <label
                    className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      selectedLevel === 'unprotected'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="protectionLevel"
                      value="unprotected"
                      checked={selectedLevel === 'unprotected'}
                      onChange={() => setSelectedLevel('unprotected')}
                      className="mt-1 text-emerald-600"
                    />
                    <div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Desprotegida (Padrão)</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        Todos os editores autenticados podem modificar o conteúdo normalmente.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Semi-Protected */}
                  <label
                    className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      selectedLevel === 'semi_protected'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="protectionLevel"
                      value="semi_protected"
                      checked={selectedLevel === 'semi_protected'}
                      onChange={() => setSelectedLevel('semi_protected')}
                      className="mt-1 text-amber-600"
                    />
                    <div>
                      <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Semiprotegida (Restrita a Contas Confirmadas)</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        Apenas usuários confirmados, autorrevisores, reversores e administradores podem editar.
                        Bloqueia contas recém-criadas e impede vandalismo em massa.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Locked */}
                  <label
                    className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                      selectedLevel === 'locked'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="protectionLevel"
                      value="locked"
                      checked={selectedLevel === 'locked'}
                      onChange={() => setSelectedLevel('locked')}
                      className="mt-1 text-red-600"
                    />
                    <div>
                      <div className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloqueada (Totalmente Protegida)</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        Apenas Burocratas e Administradores (Sysops) têm permissão de gravação.
                        Usuários comuns podem somente ler ou visualizar o código-fonte.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {selectedLevel !== 'unprotected' && (
                <>
                  {/* Preset reasons */}
                  <div>
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Motivo / Justificativa da Proteção:
                    </label>
                    <select
                      value={selectedPreset}
                      onChange={e => {
                        setSelectedPreset(e.target.value);
                        if (e.target.value !== 'Outro motivo personalizado') {
                          setCustomReason(e.target.value);
                        } else {
                          setCustomReason('');
                        }
                      }}
                      className="w-full p-2 border border-[#a2a9b1] dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {PRESET_REASONS.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Detalhes ou justificativa adicional..."
                      value={customReason}
                      onChange={e => setCustomReason(e.target.value)}
                      maxLength={500}
                      className="w-full mt-2 p-2 border border-[#a2a9b1] dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    />
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Duração da Proteção:</span>
                    </label>
                    <select
                      value={expirySelection}
                      onChange={e => setExpirySelection(e.target.value)}
                      className="w-full p-2 border border-[#a2a9b1] dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {EXPIRY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded text-blue-800 dark:text-blue-300">
              <p className="font-semibold">Informação de Acesso</p>
              <p className="text-[11px] mt-1">
                Você está visualizando as regras de proteção desta página. Para solicitar o desbloqueio
                ou alteração dos níveis, entre em contato com um administrador ou burocrata na página
                de discussão do artigo ou em <code className="font-mono">Especial:Administração</code>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-3 bg-[#f8f9fa] dark:bg-gray-800 border-t border-[#a2a9b1] dark:border-gray-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#a2a9b1] dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium cursor-pointer"
          >
            Fechar
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleSaveProtection}
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Gravando no Firestore...' : 'Confirmar e Salvar Nível'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
