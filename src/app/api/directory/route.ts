import { promises as fs } from 'fs';
import path from 'path';

function getWorkingDirectory(): string {
  // use the root folder of the project.
  // todo: should be able to let user select customized folder.
  return process.cwd();
}

/**
 * Retrieves the directory contents for a given path.
 * @param {Request} req - The request object containing the path query parameter.
 * @returns {Promise<Response>} A JSON response with the directory contents or an error message.
 */
export async function GET(req: Request): Promise<Response> {
  const baseDir = getWorkingDirectory();
  const { searchParams } = new URL(req.url);
  const targetPath = searchParams.get('path') || '';

  try {
    const fullPath = path.join(baseDir, targetPath);
    const items = await fs.readdir(fullPath, { withFileTypes: true });

    // note: this api does not return the file in the folder.
    const result = items.map((item) => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
    }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return errorResponse(error, 'Could not read directory');
  }
}

/**
 * Creates a new file or directory.
 * @param {Request} req - The request object containing the name and type (file/directory).
 * @returns {Promise<Response>} A JSON response indicating success or failure.
 */
export async function POST(req: Request): Promise<Response> {
  const baseDir = getWorkingDirectory();
  const { path: targetPath, name, type } = await req.json();

  try {
    const targetFolder = path.resolve(baseDir, targetPath);
    const stat = await fs.stat(targetFolder).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      throw new Error('Directory does not exist');
    }

    const filePath = path.join(targetPath, name);
    switch (type) {
      case 'file':
        await fs.writeFile(filePath, '');
        break;
      case 'directory':
        await fs.mkdir(filePath, { recursive: true });
        break;
      default:
        throw new Error('Invalid type. Use "file" or "directory".');
    }

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Could not create file/directory');
  }
}

/**
 * Renames a file or directory.
 * @param {Request} req - The request object containing the old and new names.
 * @returns {Promise<Response>} A JSON response indicating success or failure.
 */
export async function PATCH(req: Request): Promise<Response> {
  const baseDir = getWorkingDirectory();
  const { path: targetPath, oldName, newName } = await req.json();

  try {
    const oldPath = path.resolve(baseDir, targetPath, oldName);
    const oldStat = await fs.stat(oldPath).catch(() => null);
    if (!oldStat) {
      throw new Error('File or Directory does not exist.');
    }

    const newPath = path.resolve(baseDir, targetPath, newName);
    const newStat = await fs.stat(newPath).catch(() => null);
    if (newStat) {
      throw new Error('File or Directory already exist.');
    }

    await fs.rename(oldPath, newPath);

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return errorResponse(error, 'Could not rename file/directory');
  }
}

/**
 * Deletes a file or directory.
 * @param {Request} req - The request object containing the target path.
 * @returns {Promise<Response>} A JSON response indicating success or failure.
 */
export async function DELETE(req: Request): Promise<Response> {
  const baseDir = getWorkingDirectory();
  const { path: targetPath, name } = await req.json();

  try {
    const fullPath = path.join(baseDir, targetPath, name);
    const stat = await fs.lstat(fullPath);

    if (stat.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
    } else if (stat.isFile()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      throw new Error('File or Directory does not exist.');
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    return errorResponse(error, 'Could not delete file/directory');
  }
}
