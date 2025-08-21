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
 * Analyzes issue content to determine type
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @returns {string} - Detected issue type
 */
function detectIssueType(title, body) {
    const content = `${title} ${body || ''}`.toLowerCase();
    
    if (content.includes('bug') || content.includes('error') || content.includes('broken') || 
        content.includes('crash') || content.includes('fail')) {
        return 'bug';
    } else if (content.includes('feature') || content.includes('enhancement') || 
               content.includes('improve') || content.includes('add')) {
        return 'feature';
    } else if (content.includes('doc') || content.includes('readme') || 
               content.includes('guide') || content.includes('help')) {
        return 'documentation';
    } else if (content.includes('question') || content.includes('how') || 
               content.includes('?')) {
        return 'question';
    } else if (content.includes('duplicate') || content.includes('same')) {
        return 'duplicate';
    }
    return 'other';
}

/**
 * Extracts keywords from issue title and body
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @returns {Array<string>} - List of relevant keywords
 */
function extractKeywords(title, body) {
    const content = `${title} ${body || ''}`.toLowerCase();
    const words = content.match(/\b\w{4,}\b/g) || [];
    
    // Filter out common words and get unique keywords
    const commonWords = ['this', 'that', 'with', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'back', 'when', 'more', 'very', 'what', 'know', 'just', 'here', 'into', 'over', 'think', 'only', 'some', 'work', 'make', 'need', 'want', 'good', 'like', 'help'];
    
    return [...new Set(words)]
        .filter(word => !commonWords.includes(word))
        .slice(0, 10); // Limit to top 10 keywords
}

/**
 * Calculates priority score based on various factors
 * @param {Object} githubIssue - Raw GitHub API issue object
 * @returns {number} - Priority score (0-100)
 */
function calculatePriorityScore(githubIssue) {
    let score = 0;
    
    // Age factor (older issues get lower priority unless they have high engagement)
    const ageInDays = Math.floor((Date.now() - new Date(githubIssue.created_at)) / (1000 * 60 * 60 * 24));
    if (ageInDays < 7) score += 20; // Recent issues get higher priority
    else if (ageInDays > 180) score -= 10; // Very old issues get lower priority
    
    // Comments factor (engagement indicates importance)
    const comments = githubIssue.comments || 0;
    if (comments > 10) score += 30;
    else if (comments > 5) score += 20;
    else if (comments > 0) score += 10;
    
    // Labels factor
    const labels = githubIssue.labels || [];
    const criticalLabels = ['critical', 'urgent', 'high-priority', 'security', 'blocking'];
    const lowPriorityLabels = ['low-priority', 'nice-to-have', 'enhancement'];
    
    if (labels.some(label => criticalLabels.includes(label.name?.toLowerCase()))) {
        score += 40;
    } else if (labels.some(label => lowPriorityLabels.includes(label.name?.toLowerCase()))) {
        score -= 15;
    }
    
    // Issue type factor
    const issueType = detectIssueType(githubIssue.title, githubIssue.body);
    if (issueType === 'bug') score += 25;
    else if (issueType === 'feature') score += 15;
    else if (issueType === 'question') score += 5;
    
    // Assignee factor (unassigned issues might need attention)
    if (!githubIssue.assignee) score += 10;
    
    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

/**
 * Estimates complexity based on issue content
 * @param {string} title - Issue title  
 * @param {string} body - Issue body
 * @returns {string} - Complexity estimate (low, medium, high)
 */
function estimateComplexity(title, body) {
    const content = `${title} ${body || ''}`.toLowerCase();
    const bodyLength = (body || '').length;
    
    const complexIndicators = ['refactor', 'rewrite', 'redesign', 'architecture', 'breaking', 'major'];
    const simpleIndicators = ['typo', 'readme', 'doc', 'comment', 'text'];
    
    if (bodyLength > 1000 || complexIndicators.some(indicator => content.includes(indicator))) {
        return 'high';
    } else if (bodyLength < 200 || simpleIndicators.some(indicator => content.includes(indicator))) {
        return 'low';
    }
    return 'medium';
}

/**
 * Suggests appropriate labels based on issue analysis
 * @param {string} issueType - Detected issue type
 * @param {string} complexity - Estimated complexity
 * @param {number} priorityScore - Calculated priority score
 * @returns {Array<string>} - Suggested labels
 */
function suggestLabels(issueType, complexity, priorityScore) {
    const labels = [];
    
    // Type-based labels
    if (issueType === 'bug') labels.push('bug');
    else if (issueType === 'feature') labels.push('enhancement');
    else if (issueType === 'documentation') labels.push('documentation');
    else if (issueType === 'question') labels.push('question');
    
    // Priority-based labels
    if (priorityScore >= 70) labels.push('high-priority');
    else if (priorityScore <= 30) labels.push('low-priority');
    
    // Complexity-based labels
    if (complexity === 'high') labels.push('complex');
    else if (complexity === 'low') labels.push('good-first-issue');
    
    return labels;
}

/**
 * Analyzes an issue for triage purposes
 * @param {Object} githubIssue - Raw GitHub API issue object
 * @returns {Object} - Triage analysis
 */
function analyzeIssueForTriage(githubIssue) {
    const issueType = detectIssueType(githubIssue.title, githubIssue.body);
    const keywords = extractKeywords(githubIssue.title, githubIssue.body);
    const priorityScore = calculatePriorityScore(githubIssue);
    const complexity = estimateComplexity(githubIssue.title, githubIssue.body);
    const suggestedLabels = suggestLabels(issueType, complexity, priorityScore);
    
    const staleThresholdDays = 90;
    const staleDays = Math.floor((Date.now() - new Date(githubIssue.updated_at)) / (1000 * 60 * 60 * 24));
    const needsAttention = priorityScore >= 60 || staleDays > staleThresholdDays;
    
    return {
        issueType,
        priorityScore,
        keywords,
        complexityEstimate: complexity,
        suggestedLabels,
        needsAttention,
        staleDays
    };
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
 * Builds GitHub API URL with triage filters
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object|null} filters - Triage filters object
 * @returns {string} - Complete API URL
 */
function buildTriageUrl(owner, repo, filters) {
    const baseUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
    const params = new URLSearchParams();
    
    if (filters) {
        if (filters.state) params.append('state', filters.state);
        if (filters.assignee) params.append('assignee', filters.assignee);
        if (filters.milestone) params.append('milestone', filters.milestone);
        if (filters.since) params.append('since', filters.since);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.labels && filters.labels.length > 0) {
            params.append('labels', filters.labels.join(','));
        }
    }
    
    // Default parameters
    if (!params.has('state')) params.append('state', 'open');
    if (!params.has('per_page')) params.append('per_page', '50');
    if (!params.has('sort')) params.append('sort', 'updated');
    
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Triage issues from a GitHub repository with advanced filtering and analysis
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object|null} filters - Optional triage filters
 * @returns {Object} - Triage result with success or error
 */
async function triageIssues(owner, repo, filters) {
    try {
        // Validate inputs
        if (!owner || !repo) {
            return {
                tag: "error",
                val: "Owner and repository name are required"
            };
        }
        
        // Build GitHub API URL with filters
        const url = buildTriageUrl(owner, repo, filters);
        
        // Make the API request
        const githubIssues = await makeGitHubRequest(url);
        
        // Format and analyze issues for triage
        const triagedIssues = githubIssues.map(githubIssue => {
            const formattedIssue = formatIssue(githubIssue);
            const analysis = analyzeIssueForTriage(githubIssue);
            
            return {
                issue: formattedIssue,
                analysis: analysis
            };
        });
        
        // Sort by priority score (highest first)
        triagedIssues.sort((a, b) => b.analysis.priorityScore - a.analysis.priorityScore);
        
        return {
            tag: "success",
            val: triagedIssues
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
    triageIssues
};