import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Volume } from "memfs";
import { join } from "node:path";
import { processDirectory } from "./processor.js";
import type { FileSystem } from "./types/fs.js";
import { MemFSAdapter } from "./adapters/memfs.js";

describe("processDirectory", async () => {
	const testDir = join(process.cwd(), "test-dir");
	let volume: typeof Volume.prototype;
  let fs: FileSystem;
	// Setup before each test
	volume = Volume.fromJSON({
		[join(testDir, "test.js")]: 'console.log("test");',
		[join(testDir, "ignore.txt")]: "ignored content",
		[join(testDir, "subdir/nested.js")]: "const x = 1;",
	});
	fs = new MemFSAdapter(volume);

	it("should process files in directory", async () => {
		const files = await processDirectory(fs, testDir, ["*.txt"]);
		assert.equal(files.length, 2);
		assert.equal(files[0].path.endsWith(".js"), true);
		assert.equal(files[1].path.endsWith(".js"), true);
	});

	it("should respect ignore patterns", async () => {
		const files = await processDirectory(fs, testDir, ["*.txt", "subdir/**"]);
		assert.equal(files.length, 1);
		assert.equal(files[0].path.endsWith("test.js"), true);
	});

	it("should ignore specified file types", async () => {
		// Add some additional test files
		await volume.promises.writeFile(
			join(testDir, "another.txt"),
			"more ignored content",
		);
		await volume.promises.writeFile(
			join(testDir, "code.js"),
			'console.log("included");',
		);

		const files = await processDirectory(fs, testDir, ["*.txt"]);

		// Should only include .js files
		assert(files.every((file) => file.path.endsWith(".js")));
		// Should include all .js files
		assert(files.some((file) => file.path.includes("test.js")));
		assert(files.some((file) => file.path.includes("code.js")));
		assert(files.some((file) => file.path.includes("nested.js")));
	});

	it("should handle empty directories", async () => {
		// Create empty directory in virtual filesystem
		const emptyDir = join(testDir, "empty");
		await volume.promises.mkdir(emptyDir, { recursive: true });

		const files = await processDirectory(fs, emptyDir, []);
		assert.equal(files.length, 0);
	});

	it("should handle nested files correctly", async () => {
		const nestedFile = await fs.readFile(
			join(testDir, "subdir", "nested.js"));
		assert.equal(nestedFile, "const x = 1;");
	});

	it("should handle file stats correctly", async () => {
		const files = await processDirectory(fs, testDir, ["*.txt"]);
		const testFile = files.find((f) => f.path.endsWith("test.js"));

		assert(testFile);
		assert.equal(testFile.content, 'console.log("test");');
		assert.equal(testFile.size, 'console.log("test");'.length);
		assert(testFile.lastModified instanceof Date);
	});

	it("should process subdirectories recursively", async () => {
		// Add more nested directories and files
		await volume.promises.mkdir(join(testDir, "deep/nested/dir"), {
			recursive: true,
		});
		await volume.promises.writeFile(
			join(testDir, "deep/nested/dir/file.js"),
			"deep nested content",
		);

		const files = await processDirectory(fs, testDir, ["*.txt"]);

		assert(files.some((f) => f.path.includes("deep/nested/dir/file.js")));
		const deepFile = files.find((f) =>
			f.path.includes("deep/nested/dir/file.js"),
		);
		assert.equal(deepFile?.content, "deep nested content");
	});

	it("should handle special characters in paths", async () => {
		await volume.promises.mkdir(join(testDir, "special chars"));
		await volume.promises.writeFile(
			join(testDir, "special chars/test.js"),
			"special content",
		);
		await volume.promises.mkdir(join(testDir, "special-[@]chars"));
		await volume.promises.writeFile(
			join(testDir, "special-[@]chars/test.js"),
			"more special content",
		);

		const files = await processDirectory(fs, testDir, ["*.txt"]);

		assert(files.some((f) => f.path.includes("special chars/test.js")));
		assert(files.some((f) => f.path.includes("special-[@]chars/test.js")));
	});

	it('should respect .gitignore patterns', async () => {
		const files = {
		  [join(testDir, '.gitignore')]: `
			*.log
			dist
			temp
			ignore.txt
		  `,
		  [join(testDir, 'src/index.ts')]: 'console.log("included");',
		  [join(testDir, 'dist/bundle.js')]: 'should be ignored', 
		  [join(testDir, 'temp/debug.log')]: 'should be ignored',
		  [join(testDir, 'error.log')]: 'should be ignored'
		};
	  
		volume = Volume.fromJSON(files);
		fs = new MemFSAdapter(volume);
	  
		const processed = await processDirectory(fs, testDir, []);
		
		assert.equal(processed.length, 2); // including the `.gitignore` file itself
		assert(processed.some(f => f.path === 'src/index.ts'));
		assert(processed.some(f => f.path === '.gitignore'));
	  });
	  
	  it('should combine .gitignore with user patterns', async () => {
		const files = {
		  [join(testDir, '.gitignore')]: '*.log',
		  [join(testDir, 'src/index.ts')]: 'console.log("test");',
		  [join(testDir, 'src/types.ts')]: 'export type Test = string;',
		  [join(testDir, 'debug.log')]: 'ignored by gitignore',
		  [join(testDir, 'tests/test.ts')]: 'should be ignored by user pattern'
		};
	  
		volume = Volume.fromJSON(files);
		fs = new MemFSAdapter(volume);
	  
		const processed = await processDirectory(fs, testDir, ['tests/**']);
		
		assert.equal(processed.length, 3);
		assert(processed.some(f => f.path === 'src/index.ts'));
		assert(processed.some(f => f.path === 'src/types.ts'));
		assert(processed.some(f => f.path === '.gitignore'));
	  });
});
