# GitHub Pull Requests Tool

A Wassette-compatible WebAssembly component for fetching GitHub pull requests via the GitHub API.

## Overview

This tool provides a simple interface to list pull requests from any public GitHub repository. It's built as a WebAssembly component using JavaScript and follows Wassette standards for tool integration.

## Features

- List pull requests from any public GitHub repository
- Filter by PR state (open, closed, all)
- Returns structured pull request data including:
  - PR ID, number, title, and body
  - State (open/closed) and timestamps
  - Author information
  - Labels
  - Head and base branch information
  - Repository information
  - Merge status
  - Direct URL to the pull request

## WIT Interface

The tool exports a `github-api` interface with the following function:

```wit
list-prs: func(owner: string, repo: string, state: option<string>) -> api-result
```

Where:
- `owner`: The GitHub repository owner (username or organization)
- `repo`: The repository name
- `state`: Optional filter for PR state ("open", "closed", "all"). Defaults to "open" if not provided.

## Building

1. Install dependencies:
```bash
npm install
```

2. Build the WebAssembly component:
```bash
npm run build:component
```

This creates `github-prs.wasm` component that can be used with Wassette.

## Usage

### With wasmtime

You can test the component directly with wasmtime:

```bash
# List open pull requests from a repository
wasmtime run -Shttp --invoke 'list-prs("microsoft", "vscode", none)' github-prs.wasm

# List all pull requests (open and closed)
wasmtime run -Shttp --invoke 'list-prs("facebook", "react", some("all"))' github-prs.wasm

# List only closed pull requests
wasmtime run -Shttp --invoke 'list-prs("kubernetes", "kubernetes", some("closed"))' github-prs.wasm
```

### With Wassette

The component can be loaded and used within Wassette applications for programmatic access to GitHub pull requests.

## Example Output

The tool returns structured data for each pull request:

```json
{
  "tag": "success",
  "val": [
    {
      "id": 1234567890,
      "number": 123,
      "title": "Add new feature",
      "body": "This PR adds a new feature to the project...",
      "state": "open",
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-01T15:30:00Z",
      "author": "octocat",
      "labels": ["enhancement", "feature"],
      "url": "https://github.com/owner/repo/pull/123",
      "headBranch": "feature-branch",
      "baseBranch": "main",
      "headRepo": "octocat/repo",
      "baseRepo": "owner/repo",
      "mergeable": true,
      "merged": false
    }
  ]
}
```

## Error Handling

The tool handles various error scenarios:
- Invalid repository owners or names
- Network connectivity issues
- GitHub API rate limiting
- Non-existent repositories

Errors are returned in a structured format:

```json
{
  "tag": "error",
  "val": "Error message describing the issue"
}
```

## Dependencies

- `@bytecodealliance/componentize-js`: For building WebAssembly components
- `@bytecodealliance/jco`: JavaScript tooling for WebAssembly components

## License

Apache-2.0

## Note

This tool requires internet access and uses the GitHub public API. No authentication is required for public repositories, but rate limits may apply.