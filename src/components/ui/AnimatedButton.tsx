import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'success' | 'info' | 'neutral' | 'secondary' | 'warning' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md',
  info: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
  neutral: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  /** Иконка слева от текста (скрывается во время загрузки). */
  icon?: React.ReactNode;
}

/**
 * Универсальная кнопка с анимацией нажатия и наведения (framer-motion).
 * Используется во всей админке для единого стиля и «живого» отклика.
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, fullWidth = false, icon, disabled, className = '', children, ...props },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.04, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'lg' ? 20 : 16} />
        ) : (
          icon
        )}
        {children as React.ReactNode}
      </motion.button>
    );
  },
);

AnimatedButton.displayName = 'AnimatedButton';
