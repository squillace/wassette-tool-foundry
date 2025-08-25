/**
 * Converts a GitHub API pull request response to our pull request record format
 * @param {Object} githubPr - Raw GitHub API pull request object
 * @returns {Object} - Formatted pull request record
 */
function formatPullRequest(githubPr) {
    return {
        id: githubPr.id,
        number: githubPr.number,
        title: githubPr.title,
        body: githubPr.body || null,
        state: githubPr.state,
        createdAt: githubPr.created_at,
        updatedAt: githubPr.updated_at,
        author: githubPr.user?.login || "unknown",
        labels: githubPr.labels?.map(label => label.name) || [],
        url: githubPr.html_url,
        merged: githubPr.merged || false,
        mergeable: githubPr.mergeable,
        headRef: githubPr.head?.ref || "unknown",
        baseRef: githubPr.base?.ref || "unknown",
        headSha: githubPr.head?.sha || "unknown",
        baseSha: githubPr.base?.sha || "unknown",
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
                'User-Agent': 'Wassette-GitHub-PR-Tool/1.0',
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
 * List pull requests from a GitHub repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name  
 * @param {string|null} state - Pull request state filter ("open", "closed", "all")
 * @returns {Object} - API result with success or error
 */
async function listPullRequests(owner, repo, state) {
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
        const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${stateParam}&per_page=30`;
        
        // Make the API request
        const githubPullRequests = await makeGitHubRequest(url);
        
        // Format the pull requests
        const formattedPullRequests = githubPullRequests.map(formatPullRequest);
        
        return {
            tag: "success",
            val: formattedPullRequests
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
    listPullRequests
};