import { readFileSync, writeFileSync, statSync } from "node:fs";
import { glob } from "glob";
import type { FileSystem, FileStats } from "../types/fs.js";

export class RealFileSystem implements FileSystem {
	async readFile(path: string): Promise<string> {
		return readFileSync(path, "utf-8");
	}

	async writeFile(path: string, content: string): Promise<void> {
		writeFileSync(path, content);
	}

	async stat(path: string): Promise<FileStats> {
		const stats = statSync(path);
		return {
			size: stats.size,
			mtime: stats.mtime,
			isFile: () => stats.isFile(),
			isDirectory: () => stats.isDirectory(),
			isSymbolicLink: () => stats.isSymbolicLink(),
		};
	}

	async glob(pattern: string, options: { cwd: string }): Promise<string[]> {
		return glob(pattern, options);
	}
}
