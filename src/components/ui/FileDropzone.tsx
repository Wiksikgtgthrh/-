import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileText, ImageIcon } from 'lucide-react';

interface FileDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  /** Показывать миниатюру изображения для выбранного файла. */
  image?: boolean;
  /** URL уже загруженного изображения (режим редактирования). */
  existingUrl?: string | null;
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

const humanSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

/**
 * Красивая загрузка файлов на русском с drag&drop и превью —
 * заменяет стандартный «Choose file / No file chosen».
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  value,
  onChange,
  accept = 'image/*',
  image = true,
  existingUrl = null,
  label,
  hint,
  required = false,
  className = '',
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (image && value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [value, image]);

  const handleFiles = (files: FileList | null) => {
    onChange(files?.[0] ?? null);
  };

  const clear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shownImage = preview || (!value ? existingUrl : null);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <motion.label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        animate={{
          borderColor: dragging ? '#dc2626' : '#d1d5db',
          backgroundColor: dragging ? 'rgba(220,38,38,0.05)' : 'rgba(249,250,251,1)',
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          required={required && !value}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <motion.div
          animate={{ y: dragging ? -4 : 0 }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600"
        >
          <UploadCloud size={22} />
        </motion.div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-red-600">Нажмите, чтобы выбрать</span> или перетащите файл сюда
        </div>
        {hint && <div className="text-xs text-gray-400">{hint}</div>}
      </motion.label>

      <AnimatePresence>
        {(value || shownImage) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5"
          >
            {image && shownImage ? (
              <img src={shownImage} alt="Предпросмотр" className="h-14 w-14 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                {image ? <ImageIcon size={22} /> : <FileText size={22} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-800">
                {value ? value.name : 'Текущее изображение'}
              </div>
              <div className="text-xs text-gray-400">
                {value ? humanSize(value.size) : 'Загрузите новый файл, чтобы заменить'}
              </div>
            </div>
            {value && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clear}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Удалить файл"
              >
                <X size={18} />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
