import { join } from "node:path";
import type { FileStats, FileSystem } from "../types/fs.js";

export class MemFSAdapter implements FileSystem {
	// @ts-ignore
	constructor(private volume: Volume) {}

	async readFile(path: string): Promise<string> {
		return this.volume.promises.readFile(path, "utf-8");
	}

	async writeFile(path: string, content: string): Promise<void> {
		await this.volume.promises.writeFile(path, content);
	}

	async stat(path: string): Promise<FileStats> {
		const stats = await this.volume.promises.stat(path);
		return {
			size: stats.size,
			mtime: stats.mtime,
			isFile: () => stats.isFile(),
			isDirectory: () => stats.isDirectory(),
			isSymbolicLink: () => stats.isSymbolicLink(),
		};
	}

	async glob(pattern: string, options: { cwd: string }): Promise<string[]> {
		const files: string[] = [];
		const processDir = async (dir: string) => {
			const entries = await this.volume.promises.readdir(
				join(options.cwd, dir),
				{ withFileTypes: true },
			);
			for (const entry of entries) {
				const relativePath = join(dir, entry.name);
				if (entry.isDirectory()) {
					await processDir(relativePath);
				} else {
					files.push(relativePath);
				}
			}
		};
		await processDir("");
		return files;
	}
}
