# Versioning Guidelines

## Semantic Versioning

We follow [SemVer](https://semver.org/) for version numbers:

- MAJOR version for breaking changes
- MINOR version for new features
- PATCH version for bug fixes

## Creating a Release

1. Make your changes
2. Create a changeset:
   ```bash
   npx changeset
   ```
3. Commit changes and push
4. GitHub Actions will create a PR with version updates
5. Merge PR to publish to NPM and JSR

## Changeset Format

```bash
npx changeset add

# Select change type:
# - major (breaking)
# - minor (feature)
# - patch (fix)

# Write a description of your changes
```