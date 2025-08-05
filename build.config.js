/**
 * Build Configuration for Campfire V2
 * 
 * Centralized configuration for TypeScript project references,
 * build optimization, and development workflows.
 */

const path = require('path');

// ============================================================================
// PROJECT CONFIGURATION
// ============================================================================

const PROJECTS = {
  shared: {
    name: 'shared',
    path: './projects/shared',
    dependencies: [],
    outputs: ['dist'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    testCommand: 'npm test',
    priority: 1, // Build first
  },
  
  widget: {
    name: 'widget',
    path: './projects/widget',
    dependencies: ['shared'],
    outputs: ['dist', 'bundle'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    testCommand: 'npm test',
    bundleCommand: 'npm run bundle',
    priority: 2,
  },
  
  dashboard: {
    name: 'dashboard',
    path: './projects/dashboard',
    dependencies: ['shared'],
    outputs: ['dist'],
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    testCommand: 'npm test',
    priority: 2,
  },
};

// ============================================================================
// BUILD CONFIGURATION
// ============================================================================

const BUILD_CONFIG = {
  // TypeScript configuration
  typescript: {
    configFile: 'tsconfig.json',
    incremental: true,
    composite: true,
    declaration: true,
    sourceMap: true,
    strict: true,
  },
  
  // Build optimization
  optimization: {
    parallel: true,
    cache: true,
    incremental: true,
    skipUnchanged: true,
    maxConcurrency: 4,
  },
  
  // Output configuration
  output: {
    clean: false, // Don't clean by default
    preserveSymlinks: true,
    emitDeclarationOnly: false,
  },
  
  // Development configuration
  development: {
    watch: true,
    hotReload: true,
    sourceMap: true,
    preserveWatchOutput: true,
  },
  
  // Testing configuration
  testing: {
    runTests: true,
    coverage: false,
    parallel: true,
    bail: false, // Don't stop on first test failure
  },
  
  // Bundling configuration (for widget)
  bundling: {
    minify: true,
    treeshake: true,
    sourcemap: true,
    target: 'es2020',
    format: ['esm', 'cjs'],
  },
};

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const ENVIRONMENTS = {
  development: {
    ...BUILD_CONFIG,
    optimization: {
      ...BUILD_CONFIG.optimization,
      parallel: false, // Easier debugging
    },
    output: {
      ...BUILD_CONFIG.output,
      sourceMap: true,
    },
    bundling: {
      ...BUILD_CONFIG.bundling,
      minify: false,
    },
  },
  
  production: {
    ...BUILD_CONFIG,
    output: {
      ...BUILD_CONFIG.output,
      clean: true,
    },
    testing: {
      ...BUILD_CONFIG.testing,
      coverage: true,
    },
    bundling: {
      ...BUILD_CONFIG.bundling,
      minify: true,
    },
  },
  
  ci: {
    ...BUILD_CONFIG,
    optimization: {
      ...BUILD_CONFIG.optimization,
      parallel: true,
      cache: false, // Fresh builds in CI
    },
    testing: {
      ...BUILD_CONFIG.testing,
      coverage: true,
      bail: true, // Fail fast in CI
    },
  },
};

// ============================================================================
// PATH CONFIGURATION
// ============================================================================

const PATHS = {
  root: process.cwd(),
  projects: path.join(process.cwd(), 'projects'),
  scripts: path.join(process.cwd(), 'scripts'),
  dist: path.join(process.cwd(), 'dist'),
  nodeModules: path.join(process.cwd(), 'node_modules'),
  
  // Project-specific paths
  shared: {
    root: path.join(process.cwd(), 'projects/shared'),
    src: path.join(process.cwd(), 'projects/shared/src'),
    dist: path.join(process.cwd(), 'projects/shared/dist'),
  },
  
  widget: {
    root: path.join(process.cwd(), 'projects/widget'),
    src: path.join(process.cwd(), 'projects/widget/src'),
    dist: path.join(process.cwd(), 'projects/widget/dist'),
    bundle: path.join(process.cwd(), 'projects/widget/bundle'),
  },
  
  dashboard: {
    root: path.join(process.cwd(), 'projects/dashboard'),
    src: path.join(process.cwd(), 'projects/dashboard/src'),
    dist: path.join(process.cwd(), 'projects/dashboard/dist'),
  },
};

// ============================================================================
// DEPENDENCY GRAPH
// ============================================================================

function buildDependencyGraph() {
  const graph = new Map();
  
  for (const [name, project] of Object.entries(PROJECTS)) {
    graph.set(name, {
      ...project,
      dependents: [],
    });
  }
  
  // Build reverse dependencies
  for (const [name, project] of graph.entries()) {
    for (const dep of project.dependencies) {
      if (graph.has(dep)) {
        graph.get(dep).dependents.push(name);
      }
    }
  }
  
  return graph;
}

// ============================================================================
// BUILD ORDER CALCULATION
// ============================================================================

function calculateBuildOrder() {
  const graph = buildDependencyGraph();
  const visited = new Set();
  const visiting = new Set();
  const order = [];
  
  function visit(projectName) {
    if (visiting.has(projectName)) {
      throw new Error(`Circular dependency detected: ${projectName}`);
    }
    
    if (visited.has(projectName)) {
      return;
    }
    
    visiting.add(projectName);
    
    const project = graph.get(projectName);
    if (project) {
      // Visit dependencies first
      for (const dep of project.dependencies) {
        visit(dep);
      }
    }
    
    visiting.delete(projectName);
    visited.add(projectName);
    order.push(projectName);
  }
  
  // Visit all projects
  for (const projectName of graph.keys()) {
    visit(projectName);
  }
  
  return order;
}

// ============================================================================
// PARALLEL BUILD GROUPS
// ============================================================================

function calculateParallelGroups() {
  const graph = buildDependencyGraph();
  const groups = [];
  const processed = new Set();
  
  while (processed.size < Object.keys(PROJECTS).length) {
    const currentGroup = [];
    
    for (const [name, project] of graph.entries()) {
      if (processed.has(name)) continue;
      
      // Check if all dependencies are processed
      const canBuild = project.dependencies.every(dep => processed.has(dep));
      
      if (canBuild) {
        currentGroup.push(name);
      }
    }
    
    if (currentGroup.length === 0) {
      throw new Error('Circular dependency detected in parallel group calculation');
    }
    
    groups.push(currentGroup);
    currentGroup.forEach(name => processed.add(name));
  }
  
  return groups;
}

// ============================================================================
// CONFIGURATION GETTER
// ============================================================================

function getConfig(environment = 'development') {
  const env = ENVIRONMENTS[environment] || ENVIRONMENTS.development;
  
  return {
    projects: PROJECTS,
    build: env,
    paths: PATHS,
    environment,
    
    // Computed properties
    buildOrder: calculateBuildOrder(),
    parallelGroups: calculateParallelGroups(),
    dependencyGraph: buildDependencyGraph(),
    
    // Helper functions
    getProject: (name) => PROJECTS[name],
    getProjectPath: (name) => PROJECTS[name]?.path,
    getProjectDependencies: (name) => PROJECTS[name]?.dependencies || [],
    getProjectDependents: (name) => {
      const graph = buildDependencyGraph();
      return graph.get(name)?.dependents || [];
    },
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateConfiguration() {
  const errors = [];
  
  // Check project paths exist
  for (const [name, project] of Object.entries(PROJECTS)) {
    const fs = require('fs');
    const tsConfigPath = path.join(project.path, 'tsconfig.json');
    
    if (!fs.existsSync(tsConfigPath)) {
      errors.push(`Project ${name}: tsconfig.json not found at ${tsConfigPath}`);
    }
    
    const packageJsonPath = path.join(project.path, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      errors.push(`Project ${name}: package.json not found at ${packageJsonPath}`);
    }
  }
  
  // Check for circular dependencies
  try {
    calculateBuildOrder();
  } catch (error) {
    errors.push(`Dependency error: ${error.message}`);
  }
  
  // Check dependency references
  for (const [name, project] of Object.entries(PROJECTS)) {
    for (const dep of project.dependencies) {
      if (!PROJECTS[dep]) {
        errors.push(`Project ${name}: unknown dependency ${dep}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  PROJECTS,
  BUILD_CONFIG,
  ENVIRONMENTS,
  PATHS,
  getConfig,
  validateConfiguration,
  calculateBuildOrder,
  calculateParallelGroups,
  buildDependencyGraph,
};

// ============================================================================
// CLI USAGE
// ============================================================================

if (require.main === module) {
  const environment = process.argv[2] || 'development';
  const config = getConfig(environment);
  
  console.log('Build Configuration:');
  console.log('===================');
  console.log(`Environment: ${config.environment}`);
  console.log(`Build Order: ${config.buildOrder.join(' → ')}`);
  console.log('Parallel Groups:');
  config.parallelGroups.forEach((group, index) => {
    console.log(`  Group ${index + 1}: ${group.join(', ')}`);
  });
  
  const validation = validateConfiguration();
  if (validation.valid) {
    console.log('\n✅ Configuration is valid');
  } else {
    console.log('\n❌ Configuration errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
}
