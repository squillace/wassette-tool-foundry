# GitHub Issues Tool

A Wassette-compatible WebAssembly component for fetching GitHub issues via the GitHub API.

## Overview

This tool provides a simple interface to list issues from any public GitHub repository. It's built as a WebAssembly component using JavaScript and follows Wassette standards for tool integration.

## Features

- List issues from any public GitHub repository
- Filter by issue state (open, closed, all)
- Returns structured issue data including:
  - Issue ID, number, title, and body
  - State (open/closed) and timestamps
  - Author information
  - Labels
  - Direct URL to the issue

## WIT Interface

The tool exports a `github-api` interface with the following function:

```wit
list-issues: func(owner: string, repo: string, state: option<string>) -> api-result
```

Where:
- `owner`: The GitHub repository owner (username or organization)
- `repo`: The repository name
- `state`: Optional filter for issue state ("open", "closed", "all"). Defaults to "open" if not provided.

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

```bash
# List open issues from a repository
wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", none)' github-issues.wasm

# List all issues (open and closed)
wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", some("all"))' github-issues.wasm

# List only closed issues
wasmtime run -Shttp --invoke 'list-issues("microsoft", "vscode", some("closed"))' github-issues.wasm
```

### With Wassette

The component can be loaded and used within Wassette applications for programmatic access to GitHub issues.

## Example Output

```
success([{
  id: 3337621306, 
  number: 4229, 
  title: "Update README with my first contribution", 
  body: some("Description of the issue..."),
  state: "open", 
  created-at: "2025-08-20T10:54:35Z", 
  updated-at: "2025-08-20T14:10:13Z", 
  author: "username", 
  labels: ["bug", "enhancement"], 
  url: "https://github.com/owner/repo/issues/4229"
}])
```

## Error Handling

The tool returns errors for:
- Invalid repository owner/name combinations
- Network failures
- GitHub API rate limiting
- Repository access issues

Example error output:
```
error("Failed to fetch from GitHub API: GitHub API error (404): Not Found")
```

## Dependencies

- `@bytecodealliance/componentize-js`: For building WebAssembly components
- `@bytecodealliance/jco`: JavaScript tooling for WebAssembly components

## License

Apache-2.0

## Note

This tool requires internet access and uses the GitHub public API. No authentication is required for public repositories, but rate limits may apply.