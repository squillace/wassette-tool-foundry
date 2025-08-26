#!/usr/bin/env node

/**
 * Enhanced test script for the GitHub Issues Tool with commenting and closing functionality
 * This script tests all three functions: list-issues, comment-on-issue, and close-issue
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔧 Enhanced GitHub Issues Tool Test Script');
console.log('===========================================\n');

// Check if component exists
if (!existsSync('./github-issues.wasm')) {
    console.log('⚠️  Component not found. Building...');
    execSync('npm run build:component', { stdio: 'inherit' });
    console.log('✅ Component built successfully!\n');
}

// Test cases for listing issues (these don't require authentication)
const listTestCases = [
    {
        name: 'List open issues from octocat/Hello-World',
        command: `wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", none)' github-issues.wasm`
    },
    {
        name: 'List all issues from octocat/Hello-World',
        command: `wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", some("all"))' github-issues.wasm`
    }
];

// Test cases for authentication-required operations (these will fail without GITHUB_TOKEN)
const authTestCases = [
    {
        name: 'Comment on issue (requires GITHUB_TOKEN)',
        command: `wasmtime run -Shttp --invoke 'comment-on-issue("octocat", "Hello-World", 1, "Test comment from Wassette tool")' github-issues.wasm`,
        expectError: true
    },
    {
        name: 'Close issue (requires GITHUB_TOKEN)',
        command: `wasmtime run -Shttp --invoke 'close-issue("octocat", "Hello-World", 1)' github-issues.wasm`,
        expectError: true
    }
];

// Helper function to run a test case
function runTest(testCase) {
    console.log(`🧪 Running: ${testCase.name}`);
    console.log(`Command: ${testCase.command}\n`);
    
    try {
        const result = execSync(testCase.command, { 
            encoding: 'utf8',
            timeout: 30000 // 30 second timeout
        });
        
        if (result.includes('success')) {
            console.log('✅ Success: Operation completed successfully');
            
            // Count issues for list operations
            if (testCase.command.includes('list-issues')) {
                const issueCount = (result.match(/\{id:/g) || []).length;
                console.log(`   Found ${issueCount} issues`);
            }
            console.log('');
        } else if (result.includes('error')) {
            if (testCase.expectError) {
                console.log('✅ Expected error occurred (authentication required):');
                console.log('   ' + result.trim() + '\n');
            } else {
                console.log('⚠️  Unexpected error occurred:');
                console.log('   ' + result.trim() + '\n');
            }
        }
    } catch (error) {
        if (testCase.expectError && error.message.includes('GITHUB_TOKEN')) {
            console.log('✅ Expected authentication error:');
            console.log('   ' + error.message + '\n');
        } else {
            console.log('❌ Test failed:');
            console.log('   ' + error.message + '\n');
        }
    }
}

// Run listing tests (no auth required)
console.log('📋 Testing issue listing functionality (no authentication required):\n');
for (const testCase of listTestCases) {
    runTest(testCase);
}

// Run authentication tests
console.log('🔐 Testing authenticated functionality (requires GITHUB_TOKEN):\n');
console.log('ℹ️  These tests will show expected authentication errors unless GITHUB_TOKEN is set\n');
for (const testCase of authTestCases) {
    runTest(testCase);
}

console.log('🎉 Test script completed!');
console.log('\n📖 Usage instructions:');
console.log('• List issues: wasmtime run -Shttp --invoke \'list-issues("owner", "repo", none)\' github-issues.wasm');
console.log('• Comment on issue: wasmtime run --env GITHUB_TOKEN=your_token -Shttp --invoke \'comment-on-issue("owner", "repo", 123, "comment")\' github-issues.wasm');
console.log('• Close issue: wasmtime run --env GITHUB_TOKEN=your_token -Shttp --invoke \'close-issue("owner", "repo", 123)\' github-issues.wasm');
console.log('\n📝 For more details, see README.md');