export interface FileData {
	path: string;
	content: string;
	size: number;
	lastModified: Date;
}

export interface ProcessOptions {
	ignore: string[];
	output: string;
}
