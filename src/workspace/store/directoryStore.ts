import { useState, useEffect } from 'react';
import { Path } from '../types/path';

export interface FileItem {
  name: string;
  type: FileType;
  children?: FileItem[];
}

export enum FileType {
  File = 'file',
  Directory = 'directory',
}

function updateTreeWithNewData(
  rootItems: FileItem[],
  path: Path,
  newChildren: FileItem[]
): FileItem[] {
  if (path.directories.length === 0) {
    return newChildren;
  }

  return rootItems.map((item) => {
    if (item.name === path.directories[0]) {
      if (path.directories.length === 1) {
        return { ...item, children: newChildren };
      }

      const newPath = new Path(path.directories.slice(1));
      return {
        ...item,
        children: updateTreeWithNewData(item.children || [], newPath, newChildren),
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
    fetchItems(new Path([]));
  }, []);

  async function fetchItems(path: Path) {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path.fullPath)}`);
      const data: FileItem[] = await res.json();
      if (path.directories.length === 0) {
        setRootItems(data);
      } else {
        setRootItems((prev) => updateTreeWithNewData(prev, path, data));
      }
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(path: Path, item: FileItem) {
    if (item.type != FileType.Directory) {
      throw new Error('Directory not found.');
    }

    // if the directory already has children, means it's loaded.
    if (item.children) {
      return;
    }

    await fetchItems(path.append(item.name));
  }

  async function createItem(path: Path, name: string, type: FileType) {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: JSON.stringify({ path: path.fullPath, name, type }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to create item');
      }

      await fetchItems(path);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  }

  async function renameItem(path: Path, oldName: string, newName: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        body: JSON.stringify({ path: path.fullPath, oldName, newName }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to rename item');
      }

      await fetchItems(path);
    } catch (error) {
      console.error('Failed to rename item:', error);
    }
  }

  async function deleteItem(path: Path, name: string) {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        body: JSON.stringify({ path: path.fullPath, name: name }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to delete item');
      }

      await fetchItems(path);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }

  return {
    rootItems,
    loading,
    handleItemClick,
    createItem,
    renameItem,
    deleteItem,
  };
}
