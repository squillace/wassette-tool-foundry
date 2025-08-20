#!/usr/bin/env node

/**
 * Simple test script to demonstrate the GitHub Issues Tool
 * This script transpiles and runs the component to test its functionality
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔧 GitHub Issues Tool Test Script');
console.log('===================================\n');

// Check if component exists
if (!existsSync('./github-issues.wasm')) {
    console.log('⚠️  Component not found. Building...');
    execSync('npm run build:component', { stdio: 'inherit' });
    console.log('✅ Component built successfully!\n');
}

// Test cases
const testCases = [
    {
        name: 'List open issues from octocat/Hello-World',
        command: `wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", none)' github-issues.wasm`
    },
    {
        name: 'List all issues from octocat/Hello-World',
        command: `wasmtime run -Shttp --invoke 'list-issues("octocat", "Hello-World", some("all"))' github-issues.wasm`
    },
    {
        name: 'Test error handling with invalid repository',
        command: `wasmtime run -Shttp --invoke 'list-issues("nonexistent", "repository", none)' github-issues.wasm`
    }
];

// Run tests
for (const testCase of testCases) {
    console.log(`🧪 Running: ${testCase.name}`);
    console.log(`Command: ${testCase.command}\n`);
    
    try {
        const result = execSync(testCase.command, { 
            encoding: 'utf8',
            timeout: 30000 // 30 second timeout
        });
        
        if (result.includes('success')) {
            console.log('✅ Success: Data fetched successfully');
            const issueCount = (result.match(/\{id:/g) || []).length;
            console.log(`   Found ${issueCount} issues\n`);
        } else if (result.includes('error')) {
            console.log('⚠️  Expected error occurred:');
            console.log('   ' + result.trim() + '\n');
        }
    } catch (error) {
        console.log('❌ Test failed:');
        console.log('   ' + error.message + '\n');
    }
}

console.log('🎉 Test script completed!');
console.log('\n📖 For usage instructions, see README.md');