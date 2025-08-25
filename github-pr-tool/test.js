#!/usr/bin/env node

/**
 * Simple test script to demonstrate the GitHub PR Tool
 * This script transpiles and runs the component to test its functionality
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔧 GitHub PR Tool Test Script');
console.log('==============================\n');

// Check if component exists
if (!existsSync('./github-pr.wasm')) {
    console.log('⚠️  Component not found. Building...');
    execSync('npm run build:component', { stdio: 'inherit' });
    console.log('✅ Component built successfully!\n');
}

// Test cases
const testCases = [
    {
        name: 'List open pull requests from microsoft/vscode',
        command: `wasmtime run -Shttp --invoke 'list-pull-requests("microsoft", "vscode", none)' github-pr.wasm`
    },
    {
        name: 'List all pull requests from microsoft/vscode',
        command: `wasmtime run -Shttp --invoke 'list-pull-requests("microsoft", "vscode", some("all"))' github-pr.wasm`
    },
    {
        name: 'List closed pull requests from octocat/Hello-World',
        command: `wasmtime run -Shttp --invoke 'list-pull-requests("octocat", "Hello-World", some("closed"))' github-pr.wasm`
    },
    {
        name: 'Test error handling with invalid repository',
        command: `wasmtime run -Shttp --invoke 'list-pull-requests("nonexistent", "repository", none)' github-pr.wasm`
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
            const prCount = (result.match(/\{id:/g) || []).length;
            console.log(`   Found ${prCount} pull requests\n`);
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