import { useState } from 'react';

export function useExpandedKeys() {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  function toggleExpand(path: string) {
    setExpandedKeys((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  }

  return { expandedKeys, toggleExpand };
}
