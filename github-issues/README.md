# GitHub Issues Tool

A Wassette-compatible WebAssembly component for accessing GitHub's Issues API to list issues from public repositories.

## Features

- List issues from any public GitHub repository
- Filter by issue state (open, closed, all)
- Configurable pagination (up to 100 issues per request)
- Structured output with comprehensive issue metadata
- Error handling with descriptive messages

## API Interface

### Function: `list-issues`

**Parameters:**
- `owner` (string): Repository owner (username or organization)
- `repo` (string): Repository name
- `state` (string): Issue state filter - one of "open", "closed", "all"
- `per-page` (u32): Number of issues per page (1-100, default: 30)

**Returns:**
- Success: List of issues with the following fields:
  - `number`: Issue number
  - `title`: Issue title
  - `body`: Issue description/body
  - `state`: Issue state (open/closed)
  - `user`: Username who created the issue
  - `created-at`: Creation timestamp
  - `updated-at`: Last update timestamp
  - `labels`: Array of label names
- Error: String describing the error

## Usage Examples

### Command Line with wasmtime

```bash
# List open issues from microsoft/vscode repository
wasmtime run -Shttp -Stcp -Sinherit-network -Sallow-ip-name-lookup \
  --invoke 'list-issues("microsoft","vscode","open",5)' \
  github-issues.wasm

# List all issues from octocat/Hello-World repository
wasmtime run -Shttp -Stcp -Sinherit-network -Sallow-ip-name-lookup \
  --invoke 'list-issues("octocat","Hello-World","all",10)' \
  github-issues.wasm

# List closed issues from a specific repository
wasmtime run -Shttp -Stcp -Sinherit-network -Sallow-ip-name-lookup \
  --invoke 'list-issues("owner","repo","closed",20)' \
  github-issues.wasm
```

### JavaScript Integration

```javascript
import { githubApi } from "./github-issues.js";

// List recent open issues
const result = await githubApi.listIssues("microsoft", "vscode", "open", 10);

if (result.tag === "success") {
    const issues = result.val;
    console.log(`Found ${issues.length} issues:`);
    issues.forEach(issue => {
        console.log(`#${issue.number}: ${issue.title} (${issue.state})`);
        console.log(`  Author: ${issue.user}`);
        console.log(`  Labels: ${issue.labels.join(", ")}`);
        console.log(`  Created: ${issue.createdAt}`);
        console.log("");
    });
} else {
    console.error("Error:", result.val);
}
```

## Building from Source

### Prerequisites

- Node.js (16+)
- `jco` (JavaScript Component Tools)
- `wasmtime` (WebAssembly runtime)
- `wasm-tools` (WebAssembly toolchain)

### Build Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the WebAssembly component:
   ```bash
   npm run build:component
   ```

3. Test the component:
   ```bash
   npm run test:component
   ```

### Build Scripts

- `npm run build:component` - Build the WebAssembly component
- `npm run transpile` - Transpile the component to JavaScript for Node.js
- `npm run test:component` - Test with octocat/Hello-World repository
- `npm run demo` - Demo with microsoft/vscode repository
- `npm run all` - Build and test

## Network Requirements

This component requires network access to make HTTP requests to the GitHub API. When running with wasmtime, ensure the following flags are enabled:

- `-Shttp` - Enable HTTP support
- `-Stcp` - Enable TCP socket support
- `-Sinherit-network` - Inherit host network access
- `-Sallow-ip-name-lookup` - Enable DNS lookups

## Error Handling

The component handles various error conditions:

- **Invalid parameters**: Missing owner/repo, invalid state values
- **Network errors**: Connection failures, DNS resolution issues
- **API errors**: GitHub API rate limiting, repository not found
- **Response errors**: Invalid JSON, unexpected response format

All errors are returned as structured error messages in the `api-result` variant.

## API Rate Limiting

GitHub's public API has rate limits:
- **Unauthenticated requests**: 60 requests per hour per IP
- **Repository access**: Only public repositories are accessible

For higher rate limits, consider implementing authentication in your application layer.

## Component Architecture

This tool is built using:
- **WIT (WebAssembly Interface Types)** for interface definition
- **JavaScript ES modules** for implementation
- **WASI HTTP** for network requests
- **jco componentize** for WebAssembly compilation

The component follows Wassette compatibility standards and can be composed with other WebAssembly components.

## License

Apache-2.0

## Contributing

This tool is part of the Wassette Tool Foundry. Contributions are welcome through pull requests and issues in the main repository.