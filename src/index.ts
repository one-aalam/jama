#!/usr/bin/env node
import { program } from "commander";
import { processDirectory } from "./processor.js";
import { generateMarkdown } from "./generator.js";
import chalk from "chalk";
import { RealFileSystem } from "./adapters/fs.js";
import type { FileSystem } from "./types/fs.js";
import type { ProcessOptions } from "./types/program.js";

interface MerfCLIOptions extends ProcessOptions {
	fs?: FileSystem;
}

export async function jama(
	dir: string,
	options: MerfCLIOptions,
): Promise<void> {
	const fs = options.fs || new RealFileSystem();

	try {
		console.log(chalk.blue(`Processing directory: ${dir}`));
		const files = await processDirectory(fs, dir, options.ignore || []);
		const markdown = generateMarkdown(files);
		await fs.writeFile(options.output, markdown);
		console.log(chalk.green(`✔ Successfully created ${options.output}`));
	} catch (error) {
		console.error(
			chalk.red("Error:"),
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}

program
	.name("merf")
	.description("AI-friendly code analysis and documentation tool")
	.argument("[dir]", "Directory to process", ".")
	.option("-o, --output <file>", "Output file", "jama-analysis.md")
	.option("-i, --ignore <patterns...>", "Ignore patterns", [
		"node_modules",
		".git",
	])
	.action((dir: string, options: MerfCLIOptions) => {
		jama(dir, options).catch((error) => {
			console.error(chalk.red("Error:"), error);
			process.exit(1);
		});
	});

program.parse();
