export type FileNode = {
  readonly type: NodeType.File;
  readonly name: string;
};

export type DirectoryNode = {
  readonly type: NodeType.Directory;
  readonly name: string;
  children?: Node[];
};

export type Node = FileNode | DirectoryNode;

export enum NodeType {
  File = 'file',
  Directory = 'directory',
}

export type Directory = string;

function validateDirectory(name: Directory): boolean {
  const trimmed = name.trim();
  return trimmed.length !== 0;
}

export class Path {
  private readonly _directories: Directory[];

  constructor(input: string | Directory[]) {
    if (Array.isArray(input)) {
      this._directories = input;
    } else {
      this._directories = input.split('/');
    }

    // validate the directory is valid.
    this._directories.forEach((x) => {
      if (!validateDirectory(x)) {
        throw new Error(`Invalid directory ${x}`);
      }
    });
  }

  get fullPath(): string {
    return this._directories.join('/');
  }

  get directories(): Directory[] {
    return [...this._directories];
  }

  append(directoryName: string): Path {
    return new Path([...this._directories, directoryName]);
  }

  toString(): string {
    return this.fullPath;
  }
}
