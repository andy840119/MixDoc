import { MouseEvent, useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { CircularProgress, Menu, MenuItem } from '@mui/material';
import ConfirmModal from '@/components/ConfirmModal';
import { FileItem, FileType, useDirectoryStore } from '../store/directoryStore';
import { useExpandedKeys } from '../hooks/useExpandedDirectoryPaths';
import CreateFileModal from './CreateFileModal';
import RenameFileModal from './RenameFileModal';
import CreateDirectoryModal from './CreateDirectoryModal';
import { Path } from '../types/path';

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

function generateKey(path: Path, item: FileItem): string {
  return path.toString() + '/' + item.name;
}

enum OpenModalAction {
  CreateFile = 'create_file',
  CreateDirectory = 'create_directory',
  Rename = 'rename',
  Delete = 'delete',
}

function renderTreeInDirectory(
  path: Path,
  item: FileItem,
  onItemClick: (path: Path, item: FileItem) => void,
  onContextMenuClick: (path: Path, item: FileItem, event: MouseEvent) => void
) {
  if (item.type != FileType.Directory) {
    return null;
  } else if (!item.children) {
    return <TreeItem itemId={`loading-${item.name}`} label='Loading...' />;
  } else {
    return renderTree(path.append(item.name), item.children, onItemClick, onContextMenuClick);
  }
}

function renderTree(
  path: Path,
  items: FileItem[],
  onItemClick: (path: Path, item: FileItem) => void,
  onContextMenuClick: (path: Path, item: FileItem, event: MouseEvent) => void
) {
  return items.map((item) => {
    function handleContextMenuClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();

      onContextMenuClick(path, item, event);
    }

    const key = generateKey(path, item);
    return (
      <TreeItem
        key={key}
        itemId={key}
        label={getLabel(item)}
        onClick={() => item.type === FileType.Directory && onItemClick(path, item)}
        onContextMenu={handleContextMenuClick}
      >
        {renderTreeInDirectory(path, item, onItemClick, onContextMenuClick)}
      </TreeItem>
    );
  });
}

function getCreatePath(path: Path, item: FileItem): Path {
  switch (item.type) {
    case FileType.Directory:
      return path.append(item.name);
    case FileType.File:
      return path;
    default:
      throw new Error(`Unknown file type ${item.type}`);
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
    selectedPath: Path;
    selectedFile: FileItem;
  } | null>(null);

  const [dialogType, setDialogType] = useState<OpenModalAction | null>(null);
  const [oldFileName, setOldFileName] = useState('');

  function handleDirectoryClick(path: Path, item: FileItem): void {
    handleItemClick(path, item).then(() => {
      const key = generateKey(path, item);
      toggleExpand(key);
    });
  }

  function handleContextMenu(path: Path, item: FileItem, event: MouseEvent) {
    setContextMenu({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      selectedPath: path,
      selectedFile: item,
    });
  }

  function handleMenuClose() {
    if (!contextMenu) {
      throw new Error('Context menu does not open.');
    }

    setContextMenu({
      position: null,
      selectedPath: contextMenu.selectedPath,
      selectedFile: contextMenu.selectedFile,
    });
  }

  function openDialog(type: OpenModalAction, item: FileItem) {
    setDialogType(type);

    // use the selected file if you want to rename the file.
    const oldFileName = type === OpenModalAction.Rename ? item.name : '';
    setOldFileName(oldFileName);
    handleMenuClose();
  }

  function handleCreateFile(fileName: string): void {
    if (!contextMenu) return;

    // if user click the item and trying to create the item, should create in the parent folder.
    const itemDirectory = getCreatePath(contextMenu.selectedPath, contextMenu.selectedFile);
    createItem(itemDirectory, fileName, FileType.File).then(() => {
      console.log('Creating new file in:', itemDirectory.toString(), 'with name:', oldFileName);
    });

    handleDialogClose();
  }

  function handCreateDirectory(fileName: string): void {
    if (!contextMenu) return;

    // if user click the item and trying to create the item, should create in the parent folder.
    const itemDirectory = getCreatePath(contextMenu.selectedPath, contextMenu.selectedFile);
    createItem(itemDirectory, fileName, FileType.Directory).then(() => {
      console.log('Creating new file in:', itemDirectory.toString(), 'with name:', oldFileName);
      handleDialogClose();
    });
  }

  function handleRename(newFileName: string): void {
    if (!contextMenu) return;

    const parentFolder = contextMenu.selectedPath;
    renameItem(parentFolder, oldFileName, newFileName).then(() => {
      console.log('Renaming:', parentFolder.toString(), 'from:', oldFileName, 'to:', oldFileName);
      handleDialogClose();
    });
  }

  function handleDelete(): void {
    if (!contextMenu) return;

    const parentFolder = contextMenu.selectedPath;
    const fileName = contextMenu.selectedFile.name;

    deleteItem(parentFolder, fileName).then(() => {
      console.log('Deleting:', parentFolder.toString());
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
          {renderTree(new Path([]), rootItems, handleDirectoryClick, handleContextMenu)}
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
        <MenuItem onClick={() => openDialog(OpenModalAction.CreateFile, contextMenu!.selectedFile)}>
          Create File
        </MenuItem>
        <MenuItem
          onClick={() => openDialog(OpenModalAction.CreateDirectory, contextMenu!.selectedFile)}
        >
          Create Directory
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Rename, contextMenu!.selectedFile)}>
          Rename
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Delete, contextMenu!.selectedFile)}>
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
