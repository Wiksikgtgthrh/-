import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Save, FileText } from 'lucide-react';
import { apiService, type LegalDocumentRecord } from '../services/api';
import { AnimatedButton } from './ui/AnimatedButton';
import { useToast } from '../contexts/ToastContext';

export const AdminLegalDocuments: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [docs, setDocs] = useState<LegalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { title: string; content: string }>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getLegalDocuments();
      setDocs(data);
      setDrafts(
        Object.fromEntries(data.map((d) => [d.slug, { title: d.title, content: d.content }])),
      );
    } catch {
      showError('Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (slug: string) => {
    const draft = drafts[slug];
    if (!draft) return;
    setSavingSlug(slug);
    try {
      const updated = await apiService.adminUpdateLegalDocument({
        slug,
        title: draft.title,
        content: draft.content,
      });
      setDocs((prev) => prev.map((d) => (d.slug === slug ? updated : d)));
      showSuccess('Документ сохранён');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSavingSlug(null);
    }
  };

  const togglePublish = async (doc: LegalDocumentRecord) => {
    setBusySlug(doc.slug);
    try {
      const updated = await apiService.adminUpdateLegalDocument({
        slug: doc.slug,
        is_published: !doc.is_published,
      });
      setDocs((prev) => prev.map((d) => (d.slug === doc.slug ? updated : d)));
      showSuccess(updated.is_published ? 'Документ показан на сайте' : 'Документ скрыт');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Документы</h3>
      <p className="text-sm text-gray-500 mb-6">
        Тексты пользовательского соглашения, политики конфиденциальности, условий доставки и публичной оферты.
        Скрытые документы не показываются на сайте и в форме входа.
      </p>

      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : (
        <div className="space-y-6">
          {docs.map((doc) => {
            const draft = drafts[doc.slug] ?? { title: doc.title, content: doc.content };
            return (
              <div key={doc.slug} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FileText size={18} />
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${doc.is_published ? 'bg-green-500' : 'bg-gray-400'}`}
                      aria-hidden
                    />
                    <span className="font-medium">{doc.title || doc.slug}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePublish(doc)}
                    disabled={busySlug === doc.slug}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-60 ${
                      doc.is_published
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {doc.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    {doc.is_published ? 'Скрыть' : 'Показать'}
                  </button>
                </div>

                <label className="block text-sm text-gray-600 mb-1">Заголовок</label>
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [doc.slug]: { ...draft, title: e.target.value } }))
                  }
                  className="w-full border rounded px-3 py-2 mb-3"
                />

                <label className="block text-sm text-gray-600 mb-1">Текст документа</label>
                <textarea
                  value={draft.content}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [doc.slug]: { ...draft, content: e.target.value } }))
                  }
                  rows={10}
                  className="w-full border rounded px-3 py-2 mb-3 font-mono text-sm leading-relaxed"
                />

                <AnimatedButton
                  type="button"
                  icon={<Save size={16} />}
                  loading={savingSlug === doc.slug}
                  onClick={() => save(doc.slug)}
                >
                  Сохранить
                </AnimatedButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
