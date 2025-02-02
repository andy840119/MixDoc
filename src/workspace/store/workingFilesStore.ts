import { useState } from 'react';
import { FileNode, Path } from '../types/node';

export type WorkingFileContent = ArrayBuffer | string;

export type WorkingFile = {
  readonly path: Path;
  readonly node: FileNode;
  content: WorkingFileContent;
  touched: boolean;
};

function isMatched(workingFile: WorkingFile, path: Path, file: FileNode): boolean {
  return workingFile.path.fullPath === path.fullPath && workingFile.node.name === file.name;
}

async function fetchWorkingFile(path: Path, node: FileNode): Promise<WorkingFile> {
  const response = await fetch(
    `/api/content?path=${encodeURIComponent(path.fullPath)}&name=${encodeURIComponent(node.name)}`
  );

  return {
    path,
    node,
    content: await response.arrayBuffer(),
    touched: false,
  };
}

async function saveWorkingFile(file: WorkingFile): Promise<void> {
  await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: file.path.fullPath,
      name: file.node.name,
      data: file.content,
    }),
  });
}

export function useWorkingFilesStore() {
  const [workingFiles, setWorkingFiles] = useState<WorkingFile[]>([]);
  const [currentFile, setCurrentFile] = useState<WorkingFile | null>(null);
  const [loading, setLoading] = useState(false);

  function findFile(path: Path, node: FileNode): WorkingFile | null {
    return workingFiles.find((workingFile) => isMatched(workingFile, path, node)) ?? null;
  }

  async function openFile(path: Path, node: FileNode): Promise<void> {
    let workingFile = findFile(path, node);
    if (!workingFile) {
      setLoading(true);
      workingFile = await fetchWorkingFile(path, node);
      setLoading(false);

      setWorkingFiles([...workingFiles, workingFile]);
    }

    setCurrentFile(workingFile);
  }

  function editFile(path: Path, node: FileNode, content: WorkingFileContent): void {
    const currentEditingFile = findFile(path, node);

    if (!currentEditingFile) throw new Error('File not found');

    currentEditingFile.content = content;
    currentEditingFile.touched = true;
  }

  async function resetChange(path: Path, node: FileNode): Promise<void> {
    const currentEditingFile = findFile(path, node);
    if (!currentEditingFile) throw new Error('File not found');

    currentEditingFile.content = (await fetchWorkingFile(path, node)).content;
    currentEditingFile.touched = false;
  }

  async function closeFile(path: Path, node: FileNode, discardChange: boolean): Promise<void> {
    const currentEditingFile = findFile(path, node);
    if (!currentEditingFile) throw new Error('File not found');

    if (currentEditingFile.touched && !discardChange) {
      throw new Error('Cannot close the file that is touched');
    }

    if (!discardChange) {
      setWorkingFiles(workingFiles.filter((x) => x !== currentEditingFile));
    }

    setCurrentFile(null);
  }

  return { workingFiles, currentFile, loading, openFile, editFile, resetChange, closeFile };
}
