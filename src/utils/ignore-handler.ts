import { join } from "node:path";
import ignore, { type Ignore } from "ignore";
import type { FileSystem } from "../types/fs.js";

export const DEFAULT_IGNORE = [".git", "node_modules/**"];

export class IgnoreHandler {
	private patterns: Set<string>;

	constructor(private fs: FileSystem) {
		this.patterns = new Set();
	}

	/**
	 * Gets combined ignore patterns from .gitignore and user options
	 */
	async getIgnorePatterns(
		dir: string,
		userPatterns: string[] = [],
	): Promise<string[]> {
		// Add default patterns
		this.addPatterns(DEFAULT_IGNORE);

		// Add user patterns
		this.addPatterns(userPatterns);

		// Try to read .gitignore
		try {
			const gitignorePath = join(dir, ".gitignore");
			const content = await this.fs.readFile(gitignorePath);
			const gitignorePatterns = this.parseGitignore(content);
			this.addPatterns(gitignorePatterns);
		} catch (error) {
			// .gitignore doesn't exist or can't be read - that's fine
		}

		return Array.from(this.patterns);
	}

	/**
	 * Parses .gitignore content into patterns
	 */
	private parseGitignore(content: string): string[] {
		return content
			.split("\n")
			.map((line) => line.trim())
			.filter(
				(line) => line && !line.startsWith("#") && !line.startsWith("!"), // Skip negations for now
			);
	}

	/**
	 * Adds patterns to the set, ensuring uniqueness
	 */
	private addPatterns(patterns: string[]): void {
		for (const pattern of patterns) {
			this.patterns.add(pattern);
		}
	}

	/**
	 * Creates an ignore instance with the current patterns
	 */
	createIgnore(): Ignore {
		return ignore.default().add(Array.from(this.patterns));
	}
}
