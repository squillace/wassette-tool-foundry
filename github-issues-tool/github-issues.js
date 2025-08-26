import { getEnvironment } from "wasi:cli/environment@0.2.0";

/**
 * Converts a GitHub API issue response to our issue record format
 * @param {Object} githubIssue - Raw GitHub API issue object
 * @returns {Object} - Formatted issue record
 */
function formatIssue(githubIssue) {
    return {
        id: githubIssue.id,
        number: githubIssue.number,
        title: githubIssue.title,
        body: githubIssue.body || null,
        state: githubIssue.state,
        createdAt: githubIssue.created_at,
        updatedAt: githubIssue.updated_at,
        author: githubIssue.user?.login || "unknown",
        labels: githubIssue.labels?.map(label => label.name) || [],
        url: githubIssue.html_url,
    };
}

/**
 * Converts a GitHub API comment response to our comment record format
 * @param {Object} githubComment - Raw GitHub API comment object
 * @returns {Object} - Formatted comment record
 */
function formatComment(githubComment) {
    return {
        id: githubComment.id,
        body: githubComment.body,
        author: githubComment.user?.login || "unknown",
        createdAt: githubComment.created_at,
        updatedAt: githubComment.updated_at,
        url: githubComment.html_url,
    };
}

/**
 * Gets the GitHub token from environment variables
 * @returns {string|null} - GitHub token or null if not found
 */
function getGitHubToken() {
    const env = getEnvironment();
    const token = env.find(([key]) => key === 'GITHUB_TOKEN')?.[1];
    return token || null;
}

/**
 * Makes an HTTP request to the GitHub API using fetch
 * @param {string} url - The full GitHub API URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {boolean} requireAuth - Whether authentication is required
 * @returns {Promise<Object>} - The parsed JSON response
 */
async function makeGitHubRequest(url, options = {}, requireAuth = false) {
    try {
        const headers = {
            'User-Agent': 'Wassette-GitHub-Issues-Tool/1.0',
            'Accept': 'application/vnd.github+json',
            ...options.headers
        };

        if (requireAuth) {
            const token = getGitHubToken();
            if (!token) {
                throw new Error('GITHUB_TOKEN environment variable is required for this operation');
            }
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        throw new Error(`Failed to fetch from GitHub API: ${error.message}`);
    }
}

/**
 * List issues from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name  
 * @param {string|null} state - Issue state filter ("open", "closed", "all")
 * @returns {Object} - API result with success or error
 */
async function listIssues(owner, repo, state) {
    try {
        // Validate inputs
        if (!owner || !repo) {
            return {
                tag: "error",
                val: "Owner and repository name are required"
            };
        }
        
        // Build GitHub API URL
        const stateParam = state || "open";
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${stateParam}&per_page=30`;
        
        // Make the API request
        const githubIssues = await makeGitHubRequest(url);
        
        // Format the issues
        const formattedIssues = githubIssues.map(formatIssue);
        
        return {
            tag: "success",
            val: formattedIssues
        };
    } catch (error) {
        return {
            tag: "error", 
            val: error.message
        };
    }
}

/**
 * Comment on a GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @param {string} comment - Comment body
 * @returns {Object} - API result with success or error
 */
async function commentOnIssue(owner, repo, issueNumber, comment) {
    try {
        // Validate inputs
        if (!owner || !repo || !issueNumber || !comment) {
            return {
                tag: "error",
                val: "Owner, repository name, issue number, and comment are required"
            };
        }

        // Build GitHub API URL for commenting
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}/comments`;
        
        // Make the API request
        const githubComment = await makeGitHubRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                body: comment
            })
        }, true);
        
        // Format the comment
        const formattedComment = formatComment(githubComment);
        
        return {
            tag: "success",
            val: formattedComment
        };
    } catch (error) {
        return {
            tag: "error",
            val: error.message
        };
    }
}

/**
 * Close a GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} issueNumber - Issue number
 * @returns {Object} - API result with success or error
 */
async function closeIssue(owner, repo, issueNumber) {
    try {
        // Validate inputs
        if (!owner || !repo || !issueNumber) {
            return {
                tag: "error",
                val: "Owner, repository name, and issue number are required"
            };
        }

        // Build GitHub API URL for updating issue
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`;
        
        // Make the API request to close the issue
        const githubIssue = await makeGitHubRequest(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: 'closed'
            })
        }, true);
        
        // Format the issue
        const formattedIssue = formatIssue(githubIssue);
        
        return {
            tag: "success",
            val: formattedIssue
        };
    } catch (error) {
        return {
            tag: "error",
            val: error.message
        };
    }
}

// Export the API interface
export const githubApi = {
    listIssues,
    commentOnIssue,
    closeIssue
};