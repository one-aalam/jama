import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateMarkdown } from "./generator.js";
import type { FileData } from "./types/program.js";

describe("generateMarkdown", () => {
	it("should generate markdown with correct structure", () => {
		const files: FileData[] = [
			{
				path: "test.js",
				content: 'console.log("test");',
				size: 100,
				lastModified: new Date("2024-02-14"),
			},
		];

		const markdown = generateMarkdown(files);

		assert.match(markdown, /# Project Code Overview/);
		assert.match(markdown, /Generated on:/);
		assert.match(markdown, /Total files: 1/);
		assert.match(markdown, /```javascript/);
		assert.match(markdown, /console\.log\("test"\);/);
	});

	it("should handle multiple files", () => {
		const files: FileData[] = [
			{
				path: "test.js",
				content: "const x = 1;",
				size: 100,
				lastModified: new Date("2024-02-14"),
			},
			{
				path: "style.css",
				content: "body { color: red; }",
				size: 200,
				lastModified: new Date("2024-02-14"),
			},
		];

		const markdown = generateMarkdown(files);

		assert.match(markdown, /```javascript/);
		assert.match(markdown, /```css/);
		assert.match(markdown, /Total files: 2/);
	});

	it("should format file sizes correctly", () => {
		const files: FileData[] = [
			{
				path: "large.js",
				content: "x",
				size: 1024 * 1.5, // 1.5 KB
				lastModified: new Date("2024-02-14"),
			},
		];

		const markdown = generateMarkdown(files);
		assert.match(markdown, /\(1\.50 KB\)/);
	});
});
