import { MouseEvent, useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { CircularProgress, Menu, MenuItem } from '@mui/material';
import ConfirmModal from '@/components/ConfirmModal';
import { DirectoryNode, Node, NodeType, useDirectoryStore } from '../store/directoryStore';
import { useExpandedKeys } from '../hooks/useExpandedDirectoryPaths';
import CreateFileModal from './CreateFileModal';
import RenameFileModal from './RenameFileModal';
import CreateDirectoryModal from './CreateDirectoryModal';
import { Path } from '../types/path';

function getLabel(node: Node): string {
  switch (node.type) {
    case NodeType.Directory:
      return `📁 ${node.name}`;
    case NodeType.File:
      return `📄 ${node.name}`;
    default:
      throw new Error(`Unknown file type.`);
  }
}

function generateKey(path: Path, node: Node): string {
  return path.toString() + '/' + node.name;
}

enum OpenModalAction {
  CreateFile = 'create_file',
  CreateDirectory = 'create_directory',
  Rename = 'rename',
  Delete = 'delete',
}

function renderTreeInDirectory(
  path: Path,
  node: Node,
  onNodeClick: (path: Path, node: Node) => void,
  onContextMenuClick: (path: Path, node: Node, event: MouseEvent) => void
) {
  if (node.type != NodeType.Directory) {
    return null;
  } else if (!node.children) {
    return <TreeItem itemId={`loading-${node.name}`} label='Loading...' />;
  } else {
    return renderTree(path.append(node.name), node, onNodeClick, onContextMenuClick);
  }
}

function renderTree(
  path: Path,
  directory: DirectoryNode,
  onNodeClick: (path: Path, node: Node) => void,
  onContextMenuClick: (path: Path, node: Node, event: MouseEvent) => void
) {
  return directory.children?.map((node) => {
    function handleContextMenuClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();

      onContextMenuClick(path, node, event);
    }

    const key = generateKey(path, node);
    return (
      <TreeItem
        key={key}
        itemId={key}
        label={getLabel(node)}
        onClick={() => node.type === NodeType.Directory && onNodeClick(path, node)}
        onContextMenu={handleContextMenuClick}
      >
        {renderTreeInDirectory(path, node, onNodeClick, onContextMenuClick)}
      </TreeItem>
    );
  });
}

function getCreatePath(path: Path, node: Node): Path {
  switch (node.type) {
    case NodeType.Directory:
      return path.append(node.name);
    case NodeType.File:
      return path;
    default:
      throw new Error(`Unknown node type.`);
  }
}

export default function DirectoryExplorer() {
  const { rootNode, loading, handleNodeClick, createNode, renameNode, deleteNode } =
    useDirectoryStore();
  const { expandedKeys, toggleExpand } = useExpandedKeys();

  const [contextMenu, setContextMenu] = useState<{
    position: {
      x: number;
      y: number;
    } | null;
    selectedPath: Path;
    selectedNode: Node;
  } | null>(null);

  const [dialogType, setDialogType] = useState<OpenModalAction | null>(null);
  const [fileName, setFileName] = useState('');

  function handleDirectoryClick(path: Path, node: Node): void {
    switch (node.type) {
      case NodeType.Directory:
        handleNodeClick(path, node).then(() => {
          const key = generateKey(path, node);
          toggleExpand(key);
        });
        break;
      case NodeType.File:
        // todo: open the file.
        break;
      default:
        throw new Error(`Unknown node type.`);
    }
  }

  function handleContextMenu(path: Path, node: Node, event: MouseEvent) {
    setContextMenu({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      selectedPath: path,
      selectedNode: node,
    });
  }

  function handleMenuClose() {
    if (!contextMenu) {
      throw new Error('Context menu does not open.');
    }

    setContextMenu({
      position: null,
      selectedPath: contextMenu.selectedPath,
      selectedNode: contextMenu.selectedNode,
    });
  }

  function openDialog(type: OpenModalAction, node: Node) {
    setDialogType(type);

    // use the selected file if you want to rename the file.
    const oldFileName = type === OpenModalAction.Rename ? node.name : '';
    setFileName(oldFileName);
    handleMenuClose();
  }

  function handleCreateFile(fileName: string): void {
    if (!contextMenu) return;

    // if user click the file and trying to create the file, should create in the parent folder.
    const path = getCreatePath(contextMenu.selectedPath, contextMenu.selectedNode);
    createNode(path, fileName, NodeType.File).then(() => {
      console.log('Creating new file in:', path.toString(), 'with name:', fileName);
    });

    handleDialogClose();
  }

  function handCreateDirectory(fileName: string): void {
    if (!contextMenu) return;

    // if user click the file and trying to create the directory, should create in the parent folder.
    const path = getCreatePath(contextMenu.selectedPath, contextMenu.selectedNode);
    createNode(path, fileName, NodeType.Directory).then(() => {
      console.log('Creating new file in:', path.toString(), 'with name:', fileName);
      handleDialogClose();
    });
  }

  function handleRename(newFileName: string): void {
    if (!contextMenu) return;

    const path = contextMenu.selectedPath;
    const oldFileName = contextMenu.selectedNode.name;
    renameNode(path, oldFileName, newFileName).then(() => {
      console.log('Renaming:', path.toString(), 'from:', oldFileName, 'to:', oldFileName);
      handleDialogClose();
    });
  }

  function handleDelete(): void {
    if (!contextMenu) return;

    const path = contextMenu.selectedPath;
    const fileName = contextMenu.selectedNode.name;
    deleteNode(path, fileName).then(() => {
      console.log('Deleting:', path.toString());
      handleDialogClose();
    });
  }

  function handleDialogClose() {
    setDialogType(null);
    setFileName('');
    setContextMenu(null);
  }

  return (
    <div className='p-5'>
      {loading && !rootNode.children ? (
        <CircularProgress />
      ) : (
        <SimpleTreeView aria-label='directory structure' expandedItems={Array.from(expandedKeys)}>
          {renderTree(new Path([]), rootNode, handleDirectoryClick, handleContextMenu)}
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
        <MenuItem onClick={() => openDialog(OpenModalAction.CreateFile, contextMenu!.selectedNode)}>
          Create File
        </MenuItem>
        <MenuItem
          onClick={() => openDialog(OpenModalAction.CreateDirectory, contextMenu!.selectedNode)}
        >
          Create Directory
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Rename, contextMenu!.selectedNode)}>
          Rename
        </MenuItem>
        <MenuItem onClick={() => openDialog(OpenModalAction.Delete, contextMenu!.selectedNode)}>
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
        oldFileName={fileName}
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
