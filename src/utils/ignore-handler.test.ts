import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Volume } from "memfs";
import { IgnoreHandler } from "../utils/ignore-handler.js";
import { MemFSAdapter } from "../adapters/memfs.js";
import type { FileSystem } from "../types/fs.js";

describe("IgnoreHandler", async () => {
	let volume: typeof Volume.prototype;
	let fs: FileSystem;
	let handler: IgnoreHandler;

	const setupFs = (files: Record<string, string>) => {
		volume = Volume.fromJSON(files);
		fs = new MemFSAdapter(volume);
		handler = new IgnoreHandler(fs);
	};

	it("should handle missing .gitignore", async () => {
		setupFs({});
		const patterns = await handler.getIgnorePatterns("/project");

		// Should have default patterns
		assert(patterns.includes("node_modules"));
		assert(patterns.includes(".git"));
	});

	it("should combine user patterns with defaults", async () => {
		setupFs({});
		const patterns = await handler.getIgnorePatterns("/project", [
			"dist",
			"coverage",
		]);

		assert(patterns.includes("node_modules"));
		assert(patterns.includes(".git"));
		assert(patterns.includes("dist"));
		assert(patterns.includes("coverage"));
	});

	it("should read patterns from .gitignore", async () => {
		setupFs({
			"/project/.gitignore": `
        # Build output
        dist/
        build/

        # Logs
        *.log
        
        # Dependencies
        node_modules/
      `,
		});

		const patterns = await handler.getIgnorePatterns("/project");

		assert(patterns.includes("dist/"));
		assert(patterns.includes("build/"));
		assert(patterns.includes("*.log"));
		assert(patterns.includes("node_modules/"));
	});

	it("should handle empty .gitignore", async () => {
		setupFs({
			"/project/.gitignore": "",
		});

		const patterns = await handler.getIgnorePatterns("/project");

		// Should still have default patterns
		assert(patterns.includes("node_modules"));
		assert(patterns.includes(".git"));
	});

	it("should deduplicate patterns", async () => {
		setupFs({
			"/project/.gitignore": "node_modules\ndist",
		});

		const patterns = await handler.getIgnorePatterns("/project", [
			"dist",
			"node_modules",
		]);

		// Count occurrences of each pattern
		const counts = patterns.reduce(
			(acc, pattern) => {
				acc[pattern] = (acc[pattern] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		// Each pattern should appear exactly once
		assert.equal(counts.node_modules, 1);
		assert.equal(counts.dist, 1);
	});

	it("should handle complex gitignore patterns", async () => {
		setupFs({
			"/project/.gitignore": `
        # Dependency directories
        node_modules/
        jspm_packages/

        # TypeScript cache
        *.tsbuildinfo

        # Optional npm cache directory
        .npm

        # Optional eslint cache
        .eslintcache

        # Build output
        dist
        build
        out

        # IDE settings
        .vscode/*
        !.vscode/settings.json
        .idea/
        *.sublime-workspace
      `,
		});

		const patterns = await handler.getIgnorePatterns("/project");

		assert(patterns.includes("node_modules/"));
		assert(patterns.includes("jspm_packages/"));
		assert(patterns.includes("*.tsbuildinfo"));
		assert(patterns.includes(".npm"));
		assert(patterns.includes("dist"));
		assert(patterns.includes(".vscode/*"));
	});

	it("should create valid ignore instance", async () => {
		setupFs({
			"/project/.gitignore": "*.log\ndist/",
		});

		await handler.getIgnorePatterns("/project");
		const ig = handler.createIgnore();

		assert(ig.ignores("test.log"));
		assert(ig.ignores("dist/bundle.js"));
		assert(!ig.ignores("src/index.ts"));
	});

	it("should handle Windows-style line endings", async () => {
		setupFs({
			"/project/.gitignore": "dist\r\nbuild\r\n*.log",
		});

		const patterns = await handler.getIgnorePatterns("/project");

		assert(patterns.includes("dist"));
		assert(patterns.includes("build"));
		assert(patterns.includes("*.log"));
	});

	it("should handle deeply nested .gitignore", async () => {
		setupFs({
			"/project/deeply/nested/path/.gitignore": "local-only.txt",
		});

		const patterns = await handler.getIgnorePatterns(
			"/project/deeply/nested/path",
		);

		assert(patterns.includes("local-only.txt"));
	});
});
