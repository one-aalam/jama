import type { FileData } from "./types/program.js";

function getLanguage(filePath: string): string {
	const extensions: Record<string, string> = {
		".js": "javascript",
		".jsx": "javascript",
		".ts": "typescript",
		".tsx": "typescript",
		".py": "python",
		".rb": "ruby",
		".java": "java",
		".go": "go",
		".cpp": "cpp",
		".c": "c",
		".rs": "rust",
		".php": "php",
		".cs": "csharp",
		".swift": "swift",
		".kt": "kotlin",
		".md": "markdown",
		".json": "json",
		".yml": "yaml",
		".yaml": "yaml",
		".html": "html",
		".css": "css",
		".scss": "scss",
		".sql": "sql",
		".sh": "bash",
		".bash": "bash",
		".xml": "xml",
	};

	const ext = Object.keys(extensions).find((ext) => filePath.endsWith(ext));
	return ext ? extensions[ext] : "text";
}

export function generateMarkdown(files: FileData[]): string {
	const timestamp = new Date().toISOString();
	let markdown = "# Project Code Overview\n\n";
	markdown += `Generated on: ${timestamp}\n\n`;
	markdown += `Total files: ${files.length}\n\n`;
	markdown += "## File Structure\n\n";

	// Add file tree
	const fileTree = files
		.map((file) => `- ${file.path} (${(file.size / 1024).toFixed(2)} KB)`)
		.join("\n");
	markdown += `${fileTree}\n\n`;

	// Add file contents
	markdown += "## File Contents\n\n";
	for (const file of files) {
		const language = getLanguage(file.path);
		markdown += `### ${file.path}\n\n`;
		markdown += `Last modified: ${file.lastModified}\n\n`;
		markdown += `\`\`\`${language}\n`;
		markdown += file.content;
		markdown += "\n```\n\n";
	}

	return markdown;
}
