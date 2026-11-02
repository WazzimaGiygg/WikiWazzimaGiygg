import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, Clock, User, ArrowLeft, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { WikiPage, TalkComment } from '../types/wiki';
import { subscribeToPageTalks, addTalkComment } from '../services/wikiService';
import { parseWikitext } from '../core/parser';

interface TalkViewProps {
  page: WikiPage | null;
  slug: string;
  onBackToArticle: () => void;
}

export const TalkView: React.FC<TalkViewProps> = ({ page, slug, onBackToArticle }) => {
  const { currentUser, existingPageSlugs } = useWiki();

  const [topics, setTopics] = useState<TalkComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REAL-TIME: Subscribe to talk discussions via onSnapshot
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPageTalks(slug, talks => {
      setTopics(talks);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [slug]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addTalkComment({
        pageId: slug,
        topicTitle: newTopicTitle.trim(),
        content: newTopicContent.trim(),
        author: currentUser.username,
        authorId: currentUser.uid,
      });

      setNewTopicTitle('');
      setNewTopicContent('');
      setShowNewTopicForm(false);
    } catch (err) {
      console.error('Error posting talk comment:', err);
      alert('Erro ao publicar tópico no Firestore: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="py-2">
      {/* Title */}
      <div className="border-b border-[#a2a9b1] dark:border-gray-700 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Discussão: {page?.title || slug.replace(/_/g, ' ')}</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Discussão em tempo real
            </span>
            <button
              type="button"
              onClick={onBackToArticle}
              className="text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao artigo</span>
            </button>
          </div>
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
          Espaço destinado a discussões comunitárias sincronizado instantaneamente via Firestore.
        </div>
      </div>

      {/* Add Topic Toggle */}
      <div className="mb-4">
        {!showNewTopicForm ? (
          <button
            type="button"
            onClick={() => setShowNewTopicForm(true)}
            className="px-3 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar novo tópico</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddTopic}
            className="p-4 bg-[#f8f9fa] dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded text-xs space-y-3"
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Novo Tópico de Discussão (Gravado no Firestore)
            </h3>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Título do tópico / Assunto:
              </label>
              <input
                type="text"
                required
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
                placeholder="Ex: Sugestão de nova referência sobre a versão 1.43"
                className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Mensagem (suporta wikitexto):
              </label>
              <textarea
                required
                rows={5}
                value={newTopicContent}
                onChange={e => setNewTopicContent(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="w-full p-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-[#3366cc] hover:bg-[#254b99] text-white rounded font-medium flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'A publicar...' : 'Publicar tópico no Firestore'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNewTopicForm(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Topics list */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Sincronizando discussões em tempo real...</span>
        </div>
      ) : topics.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500 bg-[#f8f9fa] dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
          Nenhum tópico aberto para esta página. Seja o primeiro a iniciar uma discussão!
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map(topic => (
            <div
              key={topic.id}
              className="p-4 bg-white dark:bg-gray-900 border border-[#a2a9b1] dark:border-gray-700 rounded shadow-2xs text-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2 mb-2">
                <h2 className="font-serif font-bold text-base text-gray-900 dark:text-gray-100">
                  {topic.topicTitle}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{topic.author}</span>
                  <span>•</span>
                  <span>{formatDate(topic.timestamp)}</span>
                </div>
              </div>

              <div
                className="mw-body-content leading-relaxed text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{
                  __html: parseWikitext(topic.content, existingPageSlugs).html,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
