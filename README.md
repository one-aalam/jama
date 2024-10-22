# Jama

A TypeScript CLI tool to aggregate your codebase into a single markdown file for use with AI models.

## Installation

```bash
npm install
npm run build
npm link
```

## Usage

```bash
jama [directory] -o output.md -i node_modules .git
```

Options:
- `-o, --output <file>`: Output file (default: codebase.md)
- `-i, --ignore <patterns...>`: Ignore patterns (default: node_modules, .git)

## Development

```bash
# Watch mode
npm run dev

# Run tests
npm test
```

## Examples

Aggregate current directory:
```bash
jama
```

Specify directory and output:
```bash
jama ./my-project -o project.md
```

Add custom ignore patterns:
```bash
jama -i node_modules .git dist build
```