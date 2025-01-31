import { MouseEvent, useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { CircularProgress, Menu, MenuItem } from '@mui/material';
import { FileItem, FileType, getPath, useDirectoryStore } from '../store/directoryStore';
import { useExpandedKeys } from '../hooks/useExpandedDirectoryPaths';
import CreateFileModal from './CreateFileModal';
import RenameFileModal from './RenameFileModal';
import ConfirmModal from '@/components/ConfirmModal';
import CreateDirectoryModal from '@/workspace/components/CreateDirectoryModal';

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

enum OpenModalAction {
  CreateFile = 'create_file',
  CreateDirectory = 'create_directory',
  Rename = 'rename',
  Delete = 'delete',
}

function renderTreeInDirectory(
  item: FileItem,
  currentDirectory: FileItem[],
  onItemClick: (path: FileItem[]) => void,
  onContextMenuClick: (event: MouseEvent, itemPath: FileItem[]) => void
) {
  if (item.type != FileType.Directory) {
    return null;
  } else if (!item.children) {
    return <TreeItem itemId={`loading-${item.name}`} label='Loading...' />;
  } else {
    return renderTree(item.children, currentDirectory, onItemClick, onContextMenuClick);
  }
}

function renderTree(
  items: FileItem[],
  parentDirectory: FileItem[],
  onItemClick: (path: FileItem[]) => void,
  onContextMenuClick: (event: MouseEvent, itemPath: FileItem[]) => void
) {
  return items.map((item) => {
    const currentDirectory = [...parentDirectory, item];
    const currentPath = getPath(currentDirectory);

    function handleContextMenuClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();

      onContextMenuClick(event, currentDirectory);
    }

    return (
      <TreeItem
        key={currentPath}
        itemId={currentPath}
        label={getLabel(item)}
        onClick={() => item.type === FileType.Directory && onItemClick(currentDirectory)}
        onContextMenu={handleContextMenuClick}
      >
        {renderTreeInDirectory(item, currentDirectory, onItemClick, onContextMenuClick)}
      </TreeItem>
    );
  });
}

function getDirectory(fileItems: FileItem[]): FileItem[] {
  switch (fileItems[fileItems.length - 1].type) {
    case FileType.Directory:
      return fileItems;
    case FileType.File:
      return fileItems.slice(0, -1);
    default:
      throw new Error(`Unknown file type ${fileItems.length - 1}`);
  }
}

export default function DirectoryExplorer() {
  const { rootItems, loading, handleItemClick, createItem, renameItem, deleteItem } =
    useDirectoryStore();
  const { expandedKeys, toggleExpand } = useExpandedKeys();

  const [contextMenu, setContextMenu] = useState<{
    position: {
      x: number;
      y: number;
    } | null;
    selectedItemPath: FileItem[];
  } | null>(null);

  const [dialogType, setDialogType] = useState<OpenModalAction | null>(null);
  const [oldFileName, setOldFileName] = useState('');

  function handleDirectoryClick(itemPath: FileItem[]): void {
    handleItemClick(itemPath).then(() => {
      const path = getPath(itemPath);
      toggleExpand(path);
    });
  }

  function handleContextMenu(event: MouseEvent, itemPath: FileItem[]) {
    setContextMenu({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      selectedItemPath: itemPath,
    });
  }

  function handleMenuClose() {
    if (!contextMenu) {
      throw new Error('Context menu does not open.');
    }

    setContextMenu({
      position: null,
      selectedItemPath: contextMenu?.selectedItemPath,
    });
  }

  function openDialog(type: OpenModalAction, itemPath: FileItem[]) {
    setDialogType(type);

    // use the selected file if you want to rename the file.
    const oldFileName = type === OpenModalAction.Rename ? itemPath[itemPath.length - 1].name : '';
    setOldFileName(oldFileName);
    handleMenuClose();
  }

  function handleCreateFile(fileName: string): void {
    if (!contextMenu) return;

    // if user click the item and trying to create the item, should create in the parent folder.
    const itemDirectory = getDirectory(contextMenu.selectedItemPath);

    createItem(itemDirectory, fileName, FileType.File).then(() => {
      console.log('Creating new file in:', getPath(itemDirectory), 'with name:', oldFileName);
    });

    handleDialogClose();
  }

  function handCreateDirectory(fileName: string): void {
    if (!contextMenu) return;

    debugger;
    console.log('create directory');

    // if user click the item and trying to create the item, should create in the parent folder.
    const itemDirectory = getDirectory(contextMenu.selectedItemPath);

    createItem(itemDirectory, fileName, FileType.Directory).then(() => {
      console.log('Creating new file in:', getPath(itemDirectory), 'with name:', oldFileName);
      handleDialogClose();
    });
  }

  function handleRename(fileName: string): void {
    if (!contextMenu) return;

    const parentFolder = contextMenu.selectedItemPath.slice(0, -1);

    renameItem(parentFolder, oldFileName, fileName).then(() => {
      console.log('Renaming:', getPath(parentFolder), 'from:', oldFileName, 'to:', oldFileName);
      handleDialogClose();
    });
  }

  function handleDelete(): void {
    if (!contextMenu) return;

    const parentFolder = contextMenu.selectedItemPath.slice(0, -1);
    const fileName = contextMenu.selectedItemPath[contextMenu.selectedItemPath.length - 1].name;

    deleteItem(parentFolder, fileName).then(() => {
      console.log('Deleting:', getPath(parentFolder));
      handleDialogClose();
    });
  }

  function handleDialogClose() {
    setDialogType(null);
    setOldFileName('');
    setContextMenu(null);
  }

  return (
    <div className='p-5'>
      {loading && !rootItems ? (
        <CircularProgress />
      ) : (
        <SimpleTreeView aria-label='directory structure' expandedItems={Array.from(expandedKeys)}>
          {renderTree(rootItems, [], handleDirectoryClick, handleContextMenu)}
        </SimpleTreeView>
      )}

      {/* Context menu for edit the file or directory */}
      <Menu
        open={Boolean(contextMenu?.position)}
        onClose={handleMenuClose}
        anchorReference='anchorPosition'
        anchorPosition={
          contextMenu?.position
            ? { top: contextMenu.position.y, left: contextMenu.position.x }
            : undefined
        }
      >
        <MenuItem
          onClick={() => openDialog(OpenModalAction.CreateFile, contextMenu!.selectedItemPath)}
        >
          Create File
        </MenuItem>
        <MenuItem
          onClick={() => openDialog(OpenModalAction.CreateDirectory, contextMenu!.selectedItemPath)}
        >
          Create Directory
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Rename, contextMenu!.selectedItemPath)}>
          Rename
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Delete, contextMenu!.selectedItemPath)}>
          Delete
        </MenuItem>
      </Menu>

      {/* modal for doing the action. */}
      <CreateFileModal
        open={dialogType === OpenModalAction.CreateFile}
        onClose={handleDialogClose}
        onSubmit={handleCreateFile}
      />
      <CreateDirectoryModal
        open={dialogType == OpenModalAction.CreateDirectory}
        onClose={handleDialogClose}
        onSubmit={handCreateDirectory}
      />
      <RenameFileModal
        open={dialogType === OpenModalAction.Rename}
        onClose={handleDialogClose}
        onSubmit={handleRename}
        oldFileName={oldFileName}
      />
      <ConfirmModal
        open={dialogType === OpenModalAction.Delete}
        onClose={handleDialogClose}
        onConfirm={handleDelete}
        message='Remove the file?'
        confirmButtonText='Delete'
      />
    </div>
  );
}
