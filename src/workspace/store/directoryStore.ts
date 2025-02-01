import { useState, useEffect } from 'react';
import { Path } from '../types/path';

type FileNode = {
  type: NodeType.File;
  name: string;
};

type DirectoryNode = {
  type: NodeType.Directory;
  name: string;
  children?: Node[];
};

export type Node = FileNode | DirectoryNode;

export enum NodeType {
  File = 'file',
  Directory = 'directory',
}

function updateTreeWithNewData(rootNodes: Node[], path: Path, newChildren: Node[]): Node[] {
  if (path.directories.length === 0) {
    return newChildren;
  }

  return rootNodes.map((node) => {
    if (node.name === path.directories[0]) {
      if (path.directories.length === 1) {
        return { ...node, children: newChildren };
      }

      const newPath = new Path(path.directories.slice(1));
      if (node.type === NodeType.Directory) {
        return {
          ...node,
          children: updateTreeWithNewData(node.children || [], newPath, newChildren),
        };
      }

      return node;
    }
    return node;
  });
}

export function useDirectoryStore() {
  const [rootNodes, setRootNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  // get the root folder if store is created.
  useEffect(() => {
    fetchNodes(new Path([]));
  }, []);

  async function fetchNodes(path: Path) {
    setLoading(true);
    try {
      const res = await fetch(`/api/directory?path=${encodeURIComponent(path.fullPath)}`);
      const data: Node[] = await res.json();
      if (path.directories.length === 0) {
        setRootNodes(data);
      } else {
        setRootNodes((prev) => updateTreeWithNewData(prev, path, data));
      }
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNodeClick(path: Path, node: DirectoryNode) {
    // if the directory already has children, means it's loaded.
    if (node.children) {
      return;
    }

    await fetchNodes(path.append(node.name));
  }

  async function createNode(path: Path, name: string, type: NodeType) {
    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        body: JSON.stringify({ path: path.fullPath, name, type }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to create node');
      }

      await fetchNodes(path);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  }

  async function renameNode(path: Path, oldName: string, newName: string) {
    try {
      const res = await fetch('/api/directory', {
        method: 'PATCH',
        body: JSON.stringify({ path: path.fullPath, oldName, newName }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to rename node');
      }

      await fetchNodes(path);
    } catch (error) {
      console.error('Failed to rename node:', error);
    }
  }

  async function deleteNode(path: Path, name: string) {
    try {
      const res = await fetch('/api/directory', {
        method: 'DELETE',
        body: JSON.stringify({ path: path.fullPath, name: name }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to delete node');
      }

      await fetchNodes(path);
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  }

  return {
    rootNodes,
    loading,
    handleNodeClick,
    createNode,
    renameNode,
    deleteNode,
  };
}
