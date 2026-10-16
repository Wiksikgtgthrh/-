import React from 'react';
import { optimizedImage } from '../services/api';

interface OptimizedImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Оригинальный URL изображения (локальный путь или внешний). */
  src: string | undefined;
  /** Желаемая ширина в CSS-пикселях — округлится до разрешённой для оптимизатора. */
  optimizeWidth: number;
  /** Качество JPEG/WebP/AVIF (по умолчанию 75). */
  quality?: number;
  /** Вызывается, если и оптимизированный, и оригинальный URL не загрузились. */
  onFinalError?: () => void;
}

/**
 * <img>, который отдаёт локальные файлы через оптимизатор Next.js
 * (AVIF/WebP + ресайз + immutable-кэш), а при ошибке откатывается
 * на оригинал. Внешние URL передаёт без изменений.
 */
export const OptimizedImg: React.FC<OptimizedImgProps> = ({
  src,
  optimizeWidth,
  quality,
  onFinalError,
  onError,
  ...rest
}) => {
  const [useOriginal, setUseOriginal] = React.useState(false);
  const optimized = optimizedImage(src, optimizeWidth, quality);
  const finalSrc = useOriginal ? src : optimized;

  if (!finalSrc) return null;

  return (
    <img
      {...rest}
      src={finalSrc}
      onError={(e) => {
        if (!useOriginal && optimized && optimized !== src) {
          // Оптимизатор не смог обработать файл (битый/отсутствует) — пробуем оригинал.
          setUseOriginal(true);
          return;
        }
        if (onFinalError) onFinalError();
        onError?.(e);
      }}
    />
  );
};
