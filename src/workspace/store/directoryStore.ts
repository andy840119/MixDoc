import { useState, useEffect } from 'react';

export interface FileItem {
  name: string;
  type: FileType;
  children?: FileItem[];
}

export enum FileType {
  File = 'file',
  Directory = 'directory',
}

export function getPath(items: FileItem[]): string {
  return items.map((x) => x.name).join('/');
}

function updateTreeWithNewData(
  rootItems: FileItem[],
  itemPath: FileItem[],
  newChildren: FileItem[]
): FileItem[] {
  if (itemPath.length === 0) {
    return newChildren;
  }

  return rootItems.map((item) => {
    if (item.name === itemPath[0].name) {
      if (itemPath.length === 1) {
        return { ...item, children: newChildren };
      }
      return {
        ...item,
        children: updateTreeWithNewData(item.children || [], itemPath.slice(1), newChildren),
      };
    }
    return item;
  });
}

export function useDirectoryStore() {
  const [rootItems, setRootItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // get the root folder if store is created.
  useEffect(() => {
    fetchItems('');
  }, []);

  async function fetchItems(path: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data: FileItem[] = await res.json();
      if (path === '') {
        setRootItems(data);
      } else {
        setRootItems((prev) =>
          updateTreeWithNewData(
            prev,
            path.split('/').map((name) => ({ name, type: FileType.Directory })),
            data
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(itemPath: FileItem[]) {
    const fileItem = itemPath[itemPath.length - 1];
    if (!fileItem || fileItem.type != FileType.Directory) {
      throw new Error('Directory not found.');
    }

    // if the directory already has children, means it's loaded.
    if (fileItem.children) {
      return;
    }

    await fetchItems(getPath(itemPath));
  }

  return {
    rootItems,
    loading,
    handleItemClick,
  };
}
