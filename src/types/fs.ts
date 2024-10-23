export interface FileStats {
	size: number;
	mtime: Date;
	isFile(): boolean;
	isDirectory(): boolean;
	isSymbolicLink(): boolean;
}

export interface FileSystem {
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	stat(path: string): Promise<FileStats>;
	glob(pattern: string, options: { cwd: string }): Promise<string[]>;
}
