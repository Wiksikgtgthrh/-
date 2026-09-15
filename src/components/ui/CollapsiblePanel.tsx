import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Сворачиваемая панель с анимацией раскрытия. Используется для больших блоков
 * инструкций (например, «Загрузка скриптом»), которые не должны занимать
 * место, пока не нужны.
 */
export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.99 }}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50"
        aria-expanded={open}
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-gray-800">{title}</span>
          {description && <span className="block text-sm text-gray-500">{description}</span>}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400">
          <ChevronDown size={20} />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="border-t border-gray-100 px-4 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
