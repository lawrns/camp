#!/usr/bin/env node

/**
 * Build Script for TypeScript Project References
 * 
 * Builds all sub-projects in the correct dependency order
 * with proper error handling and performance monitoring.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECTS = [
  {
    name: 'shared',
    path: './projects/shared',
    dependencies: [],
  },
  {
    name: 'widget',
    path: './projects/widget',
    dependencies: ['shared'],
  },
  {
    name: 'dashboard',
    path: './projects/dashboard',
    dependencies: ['shared'],
  },
];

const BUILD_OPTIONS = {
  clean: process.argv.includes('--clean'),
  watch: process.argv.includes('--watch'),
  verbose: process.argv.includes('--verbose'),
  parallel: process.argv.includes('--parallel'),
  skipTests: process.argv.includes('--skip-tests'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📦',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍',
  }[level] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, cwd = process.cwd(), options = {}) {
  if (BUILD_OPTIONS.verbose) {
    log(`Executing: ${command} in ${cwd}`, 'debug');
  }
  
  try {
    const result = execSync(command, {
      cwd,
      stdio: BUILD_OPTIONS.verbose ? 'inherit' : 'pipe',
      encoding: 'utf8',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || '',
    };
  }
}

function projectExists(projectPath) {
  return fs.existsSync(path.join(projectPath, 'tsconfig.json'));
}

function getDependencyOrder(projects) {
  const visited = new Set();
  const visiting = new Set();
  const order = [];
  
  function visit(project) {
    if (visiting.has(project.name)) {
      throw new Error(`Circular dependency detected involving ${project.name}`);
    }
    
    if (visited.has(project.name)) {
      return;
    }
    
    visiting.add(project.name);
    
    // Visit dependencies first
    for (const depName of project.dependencies) {
      const dep = projects.find(p => p.name === depName);
      if (dep) {
        visit(dep);
      }
    }
    
    visiting.delete(project.name);
    visited.add(project.name);
    order.push(project);
  }
  
  for (const project of projects) {
    visit(project);
  }
  
  return order;
}

// ============================================================================
// BUILD FUNCTIONS
// ============================================================================

async function cleanProject(project) {
  log(`Cleaning ${project.name}...`);
  
  const result = execCommand('npm run clean', project.path);
  
  if (!result.success) {
    log(`Failed to clean ${project.name}: ${result.error}`, 'warning');
  } else {
    log(`Cleaned ${project.name}`, 'success');
  }
  
  return result.success;
}

async function buildProject(project) {
  log(`Building ${project.name}...`);
  
  const startTime = Date.now();
  const command = BUILD_OPTIONS.watch ? 'npm run dev' : 'npm run build';
  const result = execCommand(command, project.path);
  const duration = Date.now() - startTime;
  
  if (result.success) {
    log(`Built ${project.name} in ${duration}ms`, 'success');
  } else {
    log(`Failed to build ${project.name}: ${result.error}`, 'error');
    if (BUILD_OPTIONS.verbose && result.output) {
      console.log(result.output);
    }
  }
  
  return result.success;
}

async function testProject(project) {
  if (BUILD_OPTIONS.skipTests) {
    return true;
  }
  
  log(`Testing ${project.name}...`);
  
  const result = execCommand('npm test', project.path);
  
  if (result.success) {
    log(`Tests passed for ${project.name}`, 'success');
  } else {
    log(`Tests failed for ${project.name}: ${result.error}`, 'error');
  }
  
  return result.success;
}

async function buildSequential(projects) {
  const results = [];
  
  for (const project of projects) {
    if (!projectExists(project.path)) {
      log(`Project ${project.name} not found at ${project.path}`, 'warning');
      continue;
    }
    
    // Clean if requested
    if (BUILD_OPTIONS.clean) {
      await cleanProject(project);
    }
    
    // Build project
    const buildSuccess = await buildProject(project);
    
    // Test project
    const testSuccess = await testProject(project);
    
    results.push({
      project: project.name,
      buildSuccess,
      testSuccess,
      success: buildSuccess && testSuccess,
    });
    
    // Stop on first failure unless in watch mode
    if (!buildSuccess && !BUILD_OPTIONS.watch) {
      log(`Build failed for ${project.name}, stopping...`, 'error');
      break;
    }
  }
  
  return results;
}

async function buildParallel(projects) {
  // Group projects by dependency level
  const levels = [];
  const processed = new Set();
  
  while (processed.size < projects.length) {
    const currentLevel = projects.filter(project => 
      !processed.has(project.name) &&
      project.dependencies.every(dep => processed.has(dep))
    );
    
    if (currentLevel.length === 0) {
      throw new Error('Circular dependency detected');
    }
    
    levels.push(currentLevel);
    currentLevel.forEach(project => processed.add(project.name));
  }
  
  const results = [];
  
  // Build each level in parallel
  for (const level of levels) {
    log(`Building level: ${level.map(p => p.name).join(', ')}`);
    
    const promises = level.map(async (project) => {
      if (!projectExists(project.path)) {
        log(`Project ${project.name} not found at ${project.path}`, 'warning');
        return { project: project.name, success: false };
      }
      
      // Clean if requested
      if (BUILD_OPTIONS.clean) {
        await cleanProject(project);
      }
      
      // Build and test
      const buildSuccess = await buildProject(project);
      const testSuccess = await testProject(project);
      
      return {
        project: project.name,
        buildSuccess,
        testSuccess,
        success: buildSuccess && testSuccess,
      };
    });
    
    const levelResults = await Promise.all(promises);
    results.push(...levelResults);
    
    // Check if any builds failed
    const failures = levelResults.filter(r => !r.success);
    if (failures.length > 0 && !BUILD_OPTIONS.watch) {
      log(`Build failed for: ${failures.map(f => f.project).join(', ')}`, 'error');
      break;
    }
  }
  
  return results;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  log('Starting TypeScript project build...');
  
  try {
    // Validate projects
    const validProjects = PROJECTS.filter(project => {
      if (!projectExists(project.path)) {
        log(`Project ${project.name} not found at ${project.path}`, 'warning');
        return false;
      }
      return true;
    });
    
    if (validProjects.length === 0) {
      log('No valid projects found', 'error');
      process.exit(1);
    }
    
    // Get build order
    const orderedProjects = getDependencyOrder(validProjects);
    log(`Build order: ${orderedProjects.map(p => p.name).join(' → ')}`);
    
    // Build projects
    const startTime = Date.now();
    const results = BUILD_OPTIONS.parallel 
      ? await buildParallel(orderedProjects)
      : await buildSequential(orderedProjects);
    const totalTime = Date.now() - startTime;
    
    // Report results
    log('\n📊 Build Summary:');
    console.log('================');
    
    let allSuccess = true;
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.project}`);
      if (!result.success) {
        allSuccess = false;
      }
    }
    
    console.log(`\n⏱️  Total time: ${totalTime}ms`);
    console.log(`📦 Projects built: ${results.length}`);
    console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
    
    if (allSuccess) {
      log('All projects built successfully! 🎉', 'success');
      process.exit(0);
    } else {
      log('Some projects failed to build', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    if (BUILD_OPTIONS.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ============================================================================
// WATCH MODE
// ============================================================================

if (BUILD_OPTIONS.watch) {
  log('Starting watch mode...', 'info');
  
  // In watch mode, we start all projects in parallel
  const watchProcesses = [];
  
  for (const project of PROJECTS) {
    if (!projectExists(project.path)) {
      continue;
    }
    
    log(`Starting watch for ${project.name}...`);
    
    const child = spawn('npm', ['run', 'dev'], {
      cwd: project.path,
      stdio: BUILD_OPTIONS.verbose ? 'inherit' : 'pipe',
    });
    
    child.on('error', (error) => {
      log(`Watch failed for ${project.name}: ${error.message}`, 'error');
    });
    
    watchProcesses.push({ name: project.name, process: child });
  }
  
  // Handle cleanup
  process.on('SIGINT', () => {
    log('Stopping watch processes...');
    watchProcesses.forEach(({ name, process }) => {
      log(`Stopping ${name}...`);
      process.kill();
    });
    process.exit(0);
  });
  
  log('Watch mode started. Press Ctrl+C to stop.', 'success');
} else {
  // Run main build
  main();
}

// ============================================================================
// HELP
// ============================================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
TypeScript Project References Build Script

Usage: node scripts/build-projects.js [options]

Options:
  --clean       Clean projects before building
  --watch       Start in watch mode
  --parallel    Build projects in parallel (respecting dependencies)
  --verbose     Show detailed output
  --skip-tests  Skip running tests
  --help, -h    Show this help message

Examples:
  node scripts/build-projects.js                    # Build all projects
  node scripts/build-projects.js --clean            # Clean and build
  node scripts/build-projects.js --watch            # Watch mode
  node scripts/build-projects.js --parallel --clean # Parallel clean build
`);
  process.exit(0);
}
