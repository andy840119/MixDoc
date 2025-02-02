import { MouseEvent, useMemo, useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { CircularProgress, Menu, MenuItem } from '@mui/material';
import { WorkingFile } from '../store/workingFilesStore';
import { DirectoryNode, FileNode, Node, NodeType, Path } from '../types/node';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Convert the paths list to tree.
 * e.g.
 * - xxx/yyy/zzz.txt
 * - xxx/yyy/www.txt
 * - zzz/www.txt
 * should be:
 * - xxx
 *   - yyy
 *     - zzz.txt
 *     - www.txt
 * - zzz
 *   - www.txt
 * @param workingFiles working files.
 */
function buildFileTree(workingFiles: WorkingFile[]): DirectoryNode {
  const root: DirectoryNode = { type: NodeType.Directory, name: 'working_dir', children: [] };
  const pathMap = new Map<string, DirectoryNode>();

  workingFiles.forEach((file) => {
    const directories = file.path.directories;
    let currentNode = root;

    directories.forEach((dir, index) => {
      const currentPath = directories.slice(0, index + 1).join('/');

      if (!pathMap.has(currentPath)) {
        const newDir: DirectoryNode = { type: NodeType.Directory, name: dir, children: [] };
        currentNode.children?.push(newDir);
        pathMap.set(currentPath, newDir);
      }

      currentNode = pathMap.get(currentPath)!;
    });

    currentNode.children?.push({ type: NodeType.File, name: file.node.name });
  });

  return root;
}

function renderTree(
  path: Path,
  directory: DirectoryNode,
  onNodeClick: (path: Path, node: Node) => void,
  onContextMenuClick: (path: Path, node: Node, event: MouseEvent) => void
) {
  return directory.children?.map((node) => {
    const key = `${path.toString()}/${node.name}`;

    function handleContextMenuClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
      onContextMenuClick(path, node, event);
    }

    return (
      <TreeItem
        key={key}
        itemId={key}
        label={node.type === NodeType.Directory ? `📁 ${node.name}` : `📄 ${node.name}`}
        onClick={() => onNodeClick(path, node)}
        onContextMenu={handleContextMenuClick}
      >
        {node.type === NodeType.Directory &&
          node.children &&
          renderTree(path.append(node.name), node, onNodeClick, onContextMenuClick)}
      </TreeItem>
    );
  });
}

export default function WorkingFilesExplorer() {
  const { workingFiles, loading, openFile, resetChange, closeFile } =
    useWorkspace().workingFileStore;
  const node = useMemo(() => buildFileTree(workingFiles), [workingFiles]);

  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number } | null;
    selectedPath: Path;
    selectedNode: FileNode;
  } | null>(null);

  function handleNodeClick(path: Path, node: Node) {
    switch (node.type) {
      case NodeType.Directory:
        return;
      case NodeType.File:
        openFile(path, node);
        return;
      default:
        throw new Error('Unrecognized node type');
    }
  }

  function handleContextMenu(path: Path, node: Node, event: MouseEvent) {
    switch (node.type) {
      case NodeType.Directory:
        // todo: might be able to do something in the directory?
        setContextMenu(null);
        return;
      case NodeType.File:
        setContextMenu({
          position: { x: event.clientX, y: event.clientY },
          selectedPath: path,
          selectedNode: node,
        });
        return;
      default:
        throw new Error('Unrecognized node type');
    }
  }

  function handleOpenFile(path: Path, node: Node)
  {
    openFile(path, node);
    handleMenuClose();
  }

  function handleCloseFile(path: Path, node: Node) {
    closeFile(path, node, false);
    handleMenuClose();
  }

  function handleResetChange(path: Path, node: Node) {
    resetChange(path, node);
    handleMenuClose();
  }

  function handleMenuClose() {
    setContextMenu(null);
  }

  return (
    <div className='p-5'>
      {loading ? (
        <CircularProgress />
      ) : (
        <SimpleTreeView aria-label='directory structure'>
          {renderTree(new Path([]), node, handleNodeClick, handleContextMenu)}
        </SimpleTreeView>
      )}

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
          onClick={() =>
            contextMenu && handleOpenFile(contextMenu.selectedPath, contextMenu.selectedNode)
          }
        >
          Open
        </MenuItem>
        <MenuItem
          onClick={() =>
            contextMenu && handleCloseFile(contextMenu.selectedPath, contextMenu.selectedNode)
          }
        >
          Close
        </MenuItem>
        <MenuItem
          onClick={() =>
            contextMenu && handleResetChange(contextMenu.selectedPath, contextMenu.selectedNode)
          }
        >
          Revert Editing change.
        </MenuItem>
      </Menu>
    </div>
  );
}
