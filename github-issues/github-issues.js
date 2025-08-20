/**
 * GitHub Issues API WebAssembly Component
 * 
 * This component provides access to GitHub's Issues API for listing issues
 * from public repositories.
 */

/**
 * List issues from a GitHub repository
 * @param {string} owner - Repository owner (username or organization)
 * @param {string} repo - Repository name
 * @param {string} state - Issue state filter ("open", "closed", "all")
 * @param {number} perPage - Number of issues per page (max 100)
 * @returns {object} Result containing either list of issues or error message
 */
async function listIssues(owner, repo, state, perPage) {
    try {
        // Validate inputs
        if (!owner || !repo) {
            return {
                tag: "error",
                val: "Owner and repository name are required"
            };
        }

        // Ensure valid state parameter
        const validStates = ["open", "closed", "all"];
        if (!validStates.includes(state)) {
            return {
                tag: "error", 
                val: `Invalid state '${state}'. Must be one of: ${validStates.join(", ")}`
            };
        }

        // Ensure valid per_page parameter
        const pageSize = Math.min(Math.max(perPage || 30, 1), 100);

        // Construct GitHub API URL
        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
        const params = new URLSearchParams({
            state: state,
            per_page: pageSize.toString(),
            sort: "created",
            direction: "desc"
        });

        const fullUrl = `${apiUrl}?${params.toString()}`;

        // Make the API request
        const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github+json",
                "User-Agent": "Wassette-GitHub-Issues-Tool/1.0"
            }
        });

        if (!response.ok) {
            let errorText = "Unknown error";
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = `HTTP ${response.status}`;
            }
            return {
                tag: "error",
                val: `GitHub API error (${response.status}): ${errorText}`
            };
        }

        const issuesData = await response.json();

        if (!Array.isArray(issuesData)) {
            return {
                tag: "error",
                val: "Unexpected response format - not an array"
            };
        }

        // Transform GitHub API response to our issue format
        const issues = issuesData.map(issue => ({
            number: issue.number || 0,
            title: issue.title || "",
            body: issue.body || "",
            state: issue.state || "unknown",
            user: issue.user?.login || "unknown",
            createdAt: issue.created_at || "",
            updatedAt: issue.updated_at || "",
            labels: (issue.labels || []).map(label => 
                typeof label === "string" ? label : (label.name || "")
            )
        }));

        return {
            tag: "success",
            val: issues
        };

    } catch (error) {
        return {
            tag: "error",
            val: `Failed to fetch issues: ${error.message || "Unknown error"}`
        };
    }
}

// Export the interface implementation
export const githubApi = {
    listIssues
};