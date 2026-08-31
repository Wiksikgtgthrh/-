import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { apiService, type LegalDocumentRecord } from '../services/api';

const LegalDocumentPage: React.FC<{ slugOverride?: string }> = ({ slugOverride }) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || routeSlug;
  const [doc, setDoc] = useState<LegalDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const docs = await apiService.getLegalDocuments();
      const found = docs.find((d) => d.slug === slug && d.is_published);
      if (found) {
        setDoc(found);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
    window.scrollTo({ top: 0 });
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white min-h-[60vh]"
    >
      <section className="bg-gray-800 text-white py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <FileText size={28} className="text-red-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-balance">
              {doc ? doc.title : 'Документ'}
            </h1>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <p className="text-gray-500">Загрузка…</p>
          ) : notFound ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-700 mb-6">Документ недоступен или был скрыт.</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
              >
                <ArrowLeft size={18} />
                На главную
              </Link>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{doc?.content}</p>
              {doc?.updated_at && (
                <p className="text-sm text-gray-400 mt-8">
                  Обновлено: {new Date(doc.updated_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LegalDocumentPage;
