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
 * Makes an HTTP request to the GitHub API using fetch
 * @param {string} url - The full GitHub API URL
 * @returns {Promise<Object>} - The parsed JSON response
 */
async function makeGitHubRequest(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Wassette-GitHub-Issues-Tool/1.0',
                'Accept': 'application/vnd.github+json'
            }
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

// Export the API interface
export const githubApi = {
    listIssues
};