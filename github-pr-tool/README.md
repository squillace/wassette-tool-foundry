# GitHub Pull Requests Tool

A Wassette-compatible WebAssembly component for fetching GitHub pull requests via the GitHub API.

## Overview

This tool provides a simple interface to list pull requests from any public GitHub repository. It's built as a WebAssembly component using JavaScript and follows Wassette standards for tool integration.

## Features

- List pull requests from any public GitHub repository
- Filter by pull request state (open, closed, all)
- Returns structured pull request data including:
  - PR ID, number, title, and body
  - State (open/closed) and timestamps  
  - Author information and labels
  - Merge status and branch information
  - Head/base branch references and SHAs
  - Direct URL to the pull request

## WIT Interface

The tool exports a `github-api` interface with the following function:

```wit
list-pull-requests: func(owner: string, repo: string, state: option<string>) -> api-result
```

Where:
- `owner`: The GitHub repository owner (username or organization)
- `repo`: The repository name
- `state`: Optional filter for PR state ("open", "closed", "all"). Defaults to "open" if not provided.

The `api-result` variant returns either:
- `success(list<pull-request>)`: A list of formatted pull request records
- `error(string)`: An error message describing what went wrong

### Pull Request Record

Each pull request includes the following fields:

```wit
record pull-request {
    id: u64,
    number: u32,
    title: string,
    body: option<string>,
    state: string,
    created-at: string,
    updated-at: string,
    author: string,
    labels: list<string>,
    url: string,
    merged: bool,
    mergeable: option<bool>,
    head-ref: string,
    base-ref: string,
    head-sha: string,
    base-sha: string,
}
```

## Building

To build the WebAssembly component:

```bash
npm install
npm run build:component
```

This creates `github-pr.wasm` which can be used with wasmtime or other WebAssembly runtimes.

## Usage

### With wasmtime

```bash
# List open pull requests
wasmtime run -Shttp --invoke 'list-pull-requests("microsoft", "vscode", none)' github-pr.wasm

# List all pull requests (open and closed)
wasmtime run -Shttp --invoke 'list-pull-requests("microsoft", "vscode", some("all"))' github-pr.wasm

# List only closed pull requests
wasmtime run -Shttp --invoke 'list-pull-requests("owner", "repo", some("closed"))' github-pr.wasm
```

### Testing

Run the included test script:

```bash
npm test
```

This will build the component (if needed) and run several test cases against real GitHub repositories.

## Example Output

```
success([{
  id: 2003842106, 
  number: 123, 
  title: "Add new feature to improve performance", 
  body: some("This PR adds a new feature that improves overall performance..."),
  state: "open", 
  created-at: "2025-01-15T10:54:35Z", 
  updated-at: "2025-01-15T14:10:13Z", 
  author: "developer123", 
  labels: ["enhancement", "performance"], 
  url: "https://github.com/owner/repo/pull/123",
  merged: false,
  mergeable: some(true),
  head-ref: "feature-branch",
  base-ref: "main",
  head-sha: "abc123def456...",
  base-sha: "def456abc123..."
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