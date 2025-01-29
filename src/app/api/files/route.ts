import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
    // use the root folder of the project.
    // todo: should be able to let user select customized folder.
    const baseDir = process.cwd();
    const { searchParams } = new URL(req.url);
    const targetPath = searchParams.get("path") || "";

    try {
        const fullPath = path.join(baseDir, targetPath);
        const items = await fs.readdir(fullPath, { withFileTypes: true });

        // note: this api does not return the file in the folder.
        const result = items.map((item) => ({
            name: item.name,
            isDirectory: item.isDirectory(),
        }));

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        let errorMessage = "An unknown error occurred";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        return new Response(
            JSON.stringify({
                error: "Could not read directory",
                details: errorMessage,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
