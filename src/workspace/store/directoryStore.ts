import { useState, useEffect } from 'react';
import { DirectoryNode, Node, NodeType, Path } from '../types/node';

function updateTreeWithNewData(
  directory: DirectoryNode,
  path: Path,
  newChildren: Node[]
): DirectoryNode {
  if (path.directories.length === 0) {
    return {
      ...directory,
      children: newChildren,
    };
  }

  const children = directory.children?.map((node) => {
    switch (node.type) {
      case NodeType.File:
        // skip all files.
        return node;

      case NodeType.Directory:
        // skip the mismatch folder.
        if (node.name !== path.directories[0]) {
          return node;
        }

        // if it's the last one, override the children.
        if (path.directories.length === 1) {
          return { ...node, children: newChildren };
        }

        // check the child folder.
        const newPath = new Path(path.directories.slice(1));
        return updateTreeWithNewData(node, newPath, newChildren);

      default:
        throw new Error('Unknown type');
    }
  });

  return {
    ...directory,
    children: children,
  };
}

export function useDirectoryStore() {
  const [rootNode, setRootNode] = useState<DirectoryNode>({
    type: NodeType.Directory,
    name: '',
  });
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
      setRootNode((root) => updateTreeWithNewData(root, path, data));
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
    rootNode,
    loading,
    handleNodeClick,
    createNode,
    renameNode,
    deleteNode,
  };
}
