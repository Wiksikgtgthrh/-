import { useEffect, useRef } from 'react';

/**
 * Один общий IntersectionObserver на все карточки вместо отдельного
 * framer-motion whileInView на каждую (на странице каталога их 100+).
 * Элементу достаточно классов `reveal-on-scroll` (+ `revealed` добавится).
 */
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 100px 0px' },
    );
  }
  return sharedObserver;
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();
    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, []);

  return ref;
}
