# GitHub Issues Tool

A Wassette-compatible WebAssembly component for fetching and triaging GitHub issues via the GitHub API.

## Overview

This tool provides an intelligent interface to list and triage issues from any public GitHub repository. It's built as a WebAssembly component using JavaScript and follows Wassette standards for tool integration.

## Features

- **List Issues**: Basic issue listing from any public GitHub repository
- **Smart Triage**: Advanced issue analysis and prioritization with:
  - **Issue type detection** (bug, feature, documentation, question, etc.)
  - **Priority scoring** based on age, engagement, labels, and content analysis
  - **Keyword extraction** from issue titles and descriptions
  - **Complexity estimation** (low, medium, high)
  - **Label suggestions** based on analysis
  - **Staleness detection** for issues needing attention
- **Advanced Filtering**: Filter by state, labels, assignees, milestones, and dates
- **Structured Data**: Returns comprehensive issue data including:
  - Issue ID, number, title, and body
  - State (open/closed) and timestamps
  - Author information and labels
  - Direct URL to the issue
  - **Triage analysis** (for triage-issues function)

## WIT Interface

The tool exports a `github-api` interface with the following functions:

### Basic Issue Listing
```wit
list-issues: func(owner: string, repo: string, state: option<string>) -> api-result
```

### Advanced Issue Triage
```wit
triage-issues: func(owner: string, repo: string, filters: option<triage-filters>) -> triage-result
```

**Triage Filters:**
- `state`: Issue state ("open", "closed", "all")
- `labels`: Filter by specific labels
- `assignee`: Filter by assignee
- `milestone`: Filter by milestone
- `since`: Filter by creation date (ISO 8601)
- `sort`: Sort order ("created", "updated", "comments")

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

# Triage open issues with intelligent analysis (sorted by priority)
wasmtime run -Shttp --invoke 'triage-issues("microsoft", "vscode", none)' github-issues.wasm
```

### With Wassette

The component can be loaded and used within Wassette applications for programmatic access to GitHub issues and intelligent triage capabilities.

## Example Output

### Basic Issue Listing (list-issues)
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

### Triage Analysis (triage-issues)
```
success([{
  issue: {
    id: 3335004411,
    number: 262345,
    title: "Pause button no longer available until turn completed",
    body: some("With Claude Sonnet 4 in Agent mode..."),
    state: "open",
    created-at: "2025-08-19T16:35:35Z",
    updated-at: "2025-08-21T14:03:43Z",
    author: "user123",
    labels: ["info-needed"],
    url: "https://github.com/microsoft/vscode/issues/262345"
  },
  analysis: {
    issue-type: "bug",
    priority-score: 65,
    keywords: ["pause", "button", "available", "claude", "sonnet"],
    complexity-estimate: "high",
    suggested-labels: ["bug", "complex"],
    needs-attention: true,
    stale-days: 0
  }
}])
```

## Triage Analysis Features

The `triage-issues` function provides intelligent analysis:

- **Issue Type Detection**: Automatically categorizes issues as bug, feature, documentation, question, or other
- **Priority Scoring**: Calculates priority (0-100) based on:
  - Issue age and engagement (comments, reactions)
  - Labels (critical, urgent, high-priority boost score)
  - Issue type (bugs get higher priority)
  - Assignment status
- **Keyword Extraction**: Identifies important terms for categorization
- **Complexity Estimation**: Estimates implementation complexity based on content
- **Label Suggestions**: Recommends appropriate labels based on analysis
- **Attention Flags**: Identifies issues that need immediate attention
- **Staleness Tracking**: Shows days since last update

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