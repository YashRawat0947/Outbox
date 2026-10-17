import { useCallback, useState } from 'react';

/** Starred emails, kept per browser. */
export function useStars() {
  const [stars, setStars] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('rb_stars') || '[]'));
    } catch {
      return new Set();
    }
  });
  const toggle = useCallback((id) => {
    setStars((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('rb_stars', JSON.stringify([...next]));
      return next;
    });
  }, []);
  return [stars, toggle];
}
