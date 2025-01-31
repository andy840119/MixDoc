import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { CircularProgress } from '@mui/material';
import {useDirectoryStore, FileItem, getPath, FileType} from '../store/directoryStore';
import { useExpandedKeys } from '../hooks/useExpandedDirectoryPaths';

function getLabel(item: FileItem): string {
  switch (item.type) {
    case FileType.Directory:
      return `📁 ${item.name}`;
    case FileType.File:
      return `📄 ${item.name}`;
    default:
      throw new Error(`Unknown file type ${item.type}`);
  }
}

function renderTree(
  items: FileItem[],
  parentDirectory: FileItem[],
  onItemClick: (path: FileItem[]) => void
) {
  function generateTemplate(
    item: FileItem,
    currentDirectory: FileItem[],
    onItemClick: (path: FileItem[]) => void
  ) {
    if (item.type != FileType.Directory) {
      return null;
    } else if (!item.children) {
      return <TreeItem itemId={`loading-${item.name}`} label='Loading...' />;
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
        onClick={() => item.type === FileType.Directory && onItemClick(currentDirectory)}
      >
        {generateTemplate(item, currentDirectory, onItemClick)}
      </TreeItem>
    );
  });
}

export default function DirectoryExplorer() {
  const { rootItems, loading, handleItemClick } = useDirectoryStore();
  const { expandedKeys, toggleExpand } = useExpandedKeys();

  function handleDirectoryClick(itemPath: FileItem[]): void {
    handleItemClick(itemPath).then(() => {
      const path = getPath(itemPath);
      toggleExpand(path);
    });
  }

  return (
    <div className='p-5'>
      {loading && !rootItems ? (
        <CircularProgress />
      ) : (
        <SimpleTreeView aria-label='directory structure' expandedItems={Array.from(expandedKeys)}>
          {renderTree(rootItems, [], handleDirectoryClick)}
        </SimpleTreeView>
      )}
    </div>
  );
}
