import { useEffect, useState } from "react";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { CircularProgress } from "@mui/material";

interface FileItem {
  name: string;
  isDirectory: boolean;
  children?: FileItem[];
}

function getLabel(item: FileItem): string {
  return item.isDirectory ? `📁 ${item.name}` : `📄 ${item.name}`;
}

function getPath(items: FileItem[]): string {
  return items.map((x) => x.name).join("/");
}

function updateTreeWithNewData(
  rootItems: FileItem[],
  itemPath: FileItem[],
  newChildren: FileItem[],
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

function renderTree(
  items: FileItem[],
  parentDirectory: FileItem[],
  onItemClick: (path: FileItem[]) => void,
) {
  function generateTemplate(item: FileItem, currentDirectory: FileItem[], onItemClick: (path: FileItem[]) => void) {
    if (!item.isDirectory) {
      return null;
    } else if (!item.children) {
      return <TreeItem itemId={`loading-${item.name}`} label="Loading..." />;
    } else {
      return renderTree(item.children, currentDirectory, onItemClick);
    }
  }

  return items.map((item) => {
    const currentDirectory = [...parentDirectory, item];
    const currentPath = getPath(currentDirectory);

    return (
      <TreeItem
        key={currentPath}
        itemId={currentPath}
        label={getLabel(item)}
        onClick={() => item.isDirectory && onItemClick(currentDirectory)}
      >
        {generateTemplate(item, currentDirectory, onItemClick)}
      </TreeItem>
    );
  });
}

export default function DirectoryExplorer() {
  const [rootItems, setRootItems] = useState<FileItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems("", setRootItems);
  }, []);

  async function fetchItems(path: string, updateState: (items: FileItem[]) => void) {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data: FileItem[] = await res.json();
      updateState(data);
    } catch (error) {
      console.error("Failed to fetch directory:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(itemPath: FileItem[]) {
    const directory = itemPath[itemPath.length - 1];
    if (!directory || !directory.isDirectory) {
      throw new Error('Directory not found.')
    }

    const currentPath = getPath(itemPath);

    // update expand status every click.
    setExpandedKeys((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(currentPath)) {
        newExpanded.delete(currentPath);
      } else {
        newExpanded.add(currentPath);
      }
      return newExpanded;
    });

    // if the children is not empty, means it's already loaded.
    if (directory.children) {
      return;
    }

    // fetch the folder structure and update the root item.
    await fetchItems(currentPath, (data) => {
      setRootItems((prev) => updateTreeWithNewData(prev, itemPath, data));
    });
  }

  return (
    <div className="p-5">
      {(loading && !rootItems) ? (
        <CircularProgress />
      ) : (
        <SimpleTreeView aria-label="directory structure" expandedItems={Array.from(expandedKeys)}>
          {renderTree(rootItems, [], handleItemClick)}
        </SimpleTreeView>
      )}
    </div>
  );
}
