# GitHub Issues Tool

A Wassette-compatible WebAssembly component for reading, commenting on, and closing GitHub issues via the GitHub API.

## Overview

This tool provides a comprehensive interface to manage GitHub issues from any public repository. It's built as a WebAssembly component using JavaScript and follows Wassette standards for tool integration.

## Features

- **List issues** from any public GitHub repository
- **Comment on issues** (requires authentication)
- **Close issues** (requires authentication)
- Filter by issue state (open, closed, all)
- Returns structured issue and comment data including:
  - Issue ID, number, title, and body
  - State (open/closed) and timestamps
  - Author information
  - Labels
  - Direct URLs to issues and comments

## WIT Interface

The tool exports a `github-api` interface with the following functions:

```wit
/// List issues from a GitHub repository
list-issues: func(owner: string, repo: string, state: option<string>) -> list-result

/// Comment on a GitHub issue (requires GITHUB_TOKEN)
comment-on-issue: func(owner: string, repo: string, issue-number: u32, comment: string) -> comment-result

/// Close a GitHub issue (requires GITHUB_TOKEN)
close-issue: func(owner: string, repo: string, issue-number: u32) -> operation-result
```

Where:
- `owner`: The GitHub repository owner (username or organization)
- `repo`: The repository name
- `state`: Optional filter for issue state ("open", "closed", "all"). Defaults to "open" if not provided
- `issue-number`: The GitHub issue number
- `comment`: The comment text to add to the issue

## Authentication

**Reading issues** works with public repositories and requires no authentication.

**Commenting and closing issues** require a GitHub Personal Access Token with appropriate permissions:
- Set the `GITHUB_TOKEN` environment variable when running the component
- The token needs `repo` scope for private repositories or `public_repo` scope for public repositories

## Building

1. Install dependencies:
```bash
npm install
```

2. Build the WebAssembly component:
```bash
npm run build:component
```

This creates `github-issues.wasm` component that can be used with Wassette.

## Usage

### With wasmtime

You can test the component directly with wasmtime:

#### List Issues (No authentication required)
```bash
# List open issues from a repository
wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", none)' github-issues.wasm

# List all issues (open and closed)
wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", some("all"))' github-issues.wasm

# List only closed issues
wasmtime run -Shttp --invoke 'list-issues("microsoft", "vscode", some("closed"))' github-issues.wasm
```

#### Comment on Issues (Requires authentication)
```bash
# Comment on an issue
wasmtime run --env GITHUB_TOKEN=your_token_here -Shttp --invoke 'comment-on-issue("owner", "repo", 123, "This is a comment from the Wassette tool")' github-issues.wasm
```

#### Close Issues (Requires authentication)
```bash
# Close an issue
wasmtime run --env GITHUB_TOKEN=your_token_here -Shttp --invoke 'close-issue("owner", "repo", 123)' github-issues.wasm
```

### With Wassette

The component can be loaded and used within Wassette applications for programmatic access to GitHub issues management.

## Example Output

### List Issues
```json
{
  "tag": "success",
  "val": [
    {
      "id": 1,
      "number": 1,
      "title": "Example Issue",
      "body": "This is an example issue description",
      "state": "open",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "author": "octocat",
      "labels": ["bug", "help wanted"],
      "url": "https://github.com/octocat/Hello-World/issues/1"
    }
  ]
}
```

### Comment on Issue
```json
{
  "tag": "success",
  "val": {
    "id": 987654321,
    "body": "This is a comment from the Wassette tool",
    "author": "your-username",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "url": "https://github.com/owner/repo/issues/123#issuecomment-987654321"
  }
}
```

### Close Issue
```json
{
  "tag": "success",
  "val": {
    "id": 1,
    "number": 123,
    "title": "Issue to be closed",
    "body": "This issue will be closed",
    "state": "closed",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "author": "issue-creator",
    "labels": [],
    "url": "https://github.com/owner/repo/issues/123"
  }
}
```

## Error Handling

The tool provides detailed error messages for common scenarios:
- Missing authentication for protected operations
- Invalid repository names
- Network connectivity issues
- GitHub API rate limits
- Invalid issue numbers

All errors are returned in a consistent format:
```json
{
  "tag": "error",
  "val": "Error description here"
}
```

## Dependencies

- `@bytecodealliance/componentize-js`: For building WebAssembly components
- `@bytecodealliance/jco`: JavaScript tooling for WebAssembly components

## Testing

Run the test suite:
```bash
npm test
```

Or run the enhanced test that includes all functionality:
```bash
node test-enhanced.js
```

## License

Apache-2.0

## Note

This tool requires internet access and uses the GitHub public API. For read operations, no authentication is required for public repositories, but rate limits may apply. For write operations (commenting and closing), a valid GitHub token with appropriate permissions is required.