import { resolve, relative } from "node:path";
import type { FileSystem } from "./types/fs.js";
import type { FileData } from "./types/program.js";
import { IgnoreHandler } from './utils/ignore-handler.js';

export async function processDirectory(
	fs: FileSystem,
	dir: string,
	userIgnorePatterns: string[],
): Promise<FileData[]> {
	const ignoreHandler = new IgnoreHandler(fs);
  	await ignoreHandler.getIgnorePatterns(dir, userIgnorePatterns);
	const ig = ignoreHandler.createIgnore();
	const files = await fs.glob("**/*", {
		cwd: dir,
	});

	const fileData: FileData[] = [];
	for (const file of files) {
		if (ig.ignores(file)) continue;

		const fullPath = resolve(dir, file);
		try {
			const content = await fs.readFile(fullPath);
			const stats = await fs.stat(fullPath);

			fileData.push({
				path: relative(dir, fullPath),
				content,
				size: stats.size,
				lastModified: stats.mtime,
			});
		} catch (error) {
			console.warn(
				`Warning: Could not process ${file}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return fileData;
}
