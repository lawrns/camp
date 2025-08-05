#!/usr/bin/env node

/**
 * Widget Bundle Analyzer
 * 
 * Analyzes widget bundle sizes and provides optimization recommendations.
 * 
 * Features:
 * - Bundle size analysis
 * - Chunk size validation
 * - Performance recommendations
 * - Size comparison over time
 * - Optimization suggestions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BUNDLE_TARGETS = {
  core: 30000,      // 30KB for core widget
  features: 50000,  // 50KB per feature chunk
  total: 250000,    // 250KB total
};

const ANALYSIS_OUTPUT_DIR = path.join(process.cwd(), 'bundle-analysis');
const WEBPACK_STATS_FILE = path.join(process.cwd(), '.next/analyze/webpack-stats.json');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  log('🔍 Analyzing widget bundle...', 'blue');

  // Ensure analysis directory exists
  if (!fs.existsSync(ANALYSIS_OUTPUT_DIR)) {
    fs.mkdirSync(ANALYSIS_OUTPUT_DIR, { recursive: true });
  }

  // Build with bundle analyzer
  try {
    log('📦 Building with bundle analyzer...', 'yellow');
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Build failed', 'red');
    process.exit(1);
  }

  // Analyze webpack stats if available
  if (fs.existsSync(WEBPACK_STATS_FILE)) {
    analyzeWebpackStats();
  } else {
    log('⚠️  Webpack stats file not found, analyzing build output...', 'yellow');
    analyzeBuildOutput();
  }
}

function analyzeWebpackStats() {
  log('📊 Analyzing webpack stats...', 'blue');

  const stats = JSON.parse(fs.readFileSync(WEBPACK_STATS_FILE, 'utf8'));
  const chunks = stats.chunks || [];
  const assets = stats.assets || [];

  // Analyze widget-specific chunks
  const widgetChunks = chunks.filter(chunk => 
    chunk.names.some(name => 
      name.includes('widget') || 
      name.includes('core') || 
      name.includes('features')
    )
  );

  const analysis = {
    timestamp: new Date().toISOString(),
    chunks: [],
    totalSize: 0,
    recommendations: [],
  };

  widgetChunks.forEach(chunk => {
    const chunkAssets = assets.filter(asset => 
      chunk.files.includes(asset.name)
    );

    const chunkSize = chunkAssets.reduce((sum, asset) => sum + asset.size, 0);
    analysis.totalSize += chunkSize;

    const chunkAnalysis = {
      name: chunk.names[0],
      size: chunkSize,
      files: chunk.files,
      modules: chunk.modules?.length || 0,
    };

    analysis.chunks.push(chunkAnalysis);

    // Check against targets
    if (chunk.names[0].includes('core') && chunkSize > BUNDLE_TARGETS.core) {
      analysis.recommendations.push({
        type: 'warning',
        message: `Core widget chunk (${formatBytes(chunkSize)}) exceeds target (${formatBytes(BUNDLE_TARGETS.core)})`,
        suggestion: 'Consider removing unused dependencies or splitting core functionality',
      });
    }

    if (chunk.names[0].includes('features') && chunkSize > BUNDLE_TARGETS.features) {
      analysis.recommendations.push({
        type: 'warning',
        message: `Feature chunk ${chunk.names[0]} (${formatBytes(chunkSize)}) exceeds target (${formatBytes(BUNDLE_TARGETS.features)})`,
        suggestion: 'Consider further splitting this feature or optimizing dependencies',
      });
    }
  });

  // Check total size
  if (analysis.totalSize > BUNDLE_TARGETS.total) {
    analysis.recommendations.push({
      type: 'error',
      message: `Total bundle size (${formatBytes(analysis.totalSize)}) exceeds target (${formatBytes(BUNDLE_TARGETS.total)})`,
      suggestion: 'Review all chunks and optimize large dependencies',
    });
  }

  // Save analysis
  const analysisFile = path.join(ANALYSIS_OUTPUT_DIR, `analysis-${Date.now()}.json`);
  fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

  // Display results
  displayAnalysis(analysis);
}

function analyzeBuildOutput() {
  log('📁 Analyzing build output directory...', 'blue');

  const buildDir = path.join(process.cwd(), '.next/static/chunks');
  
  if (!fs.existsSync(buildDir)) {
    log('❌ Build directory not found', 'red');
    return;
  }

  const files = fs.readdirSync(buildDir);
  const widgetFiles = files.filter(file => 
    file.includes('widget') || 
    file.includes('core') || 
    file.includes('features')
  );

  const analysis = {
    timestamp: new Date().toISOString(),
    files: [],
    totalSize: 0,
    recommendations: [],
  };

  widgetFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    
    analysis.files.push({
      name: file,
      size: stats.size,
      path: filePath,
    });

    analysis.totalSize += stats.size;

    // Basic size checks
    if (file.includes('core') && stats.size > BUNDLE_TARGETS.core) {
      analysis.recommendations.push({
        type: 'warning',
        message: `Core file ${file} (${formatBytes(stats.size)}) exceeds target`,
        suggestion: 'Optimize core widget dependencies',
      });
    }
  });

  displayAnalysis(analysis);
}

function displayAnalysis(analysis) {
  log('\n📈 Bundle Analysis Results', 'bold');
  log('=' * 50, 'blue');

  // Display chunks/files
  if (analysis.chunks) {
    log('\n📦 Chunks:', 'blue');
    analysis.chunks.forEach(chunk => {
      const status = chunk.size > BUNDLE_TARGETS.core ? '❌' : '✅';
      log(`  ${status} ${chunk.name}: ${formatBytes(chunk.size)} (${chunk.modules} modules)`);
    });
  } else if (analysis.files) {
    log('\n📁 Files:', 'blue');
    analysis.files.forEach(file => {
      const status = file.size > BUNDLE_TARGETS.core ? '❌' : '✅';
      log(`  ${status} ${file.name}: ${formatBytes(file.size)}`);
    });
  }

  // Display total size
  log(`\n📊 Total Size: ${formatBytes(analysis.totalSize)}`, 'bold');
  
  const totalStatus = analysis.totalSize <= BUNDLE_TARGETS.total ? '✅' : '❌';
  const totalColor = analysis.totalSize <= BUNDLE_TARGETS.total ? 'green' : 'red';
  log(`${totalStatus} Target: ${formatBytes(BUNDLE_TARGETS.total)}`, totalColor);

  // Display recommendations
  if (analysis.recommendations.length > 0) {
    log('\n💡 Recommendations:', 'yellow');
    analysis.recommendations.forEach(rec => {
      const icon = rec.type === 'error' ? '🚨' : '⚠️';
      log(`  ${icon} ${rec.message}`, rec.type === 'error' ? 'red' : 'yellow');
      log(`     💡 ${rec.suggestion}`, 'blue');
    });
  } else {
    log('\n✅ All bundle size targets met!', 'green');
  }

  // Performance score
  const score = calculatePerformanceScore(analysis);
  log(`\n🎯 Performance Score: ${score}/100`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');
}

function calculatePerformanceScore(analysis) {
  let score = 100;

  // Deduct points for size overages
  const totalOverage = Math.max(0, analysis.totalSize - BUNDLE_TARGETS.total);
  score -= Math.min(50, (totalOverage / BUNDLE_TARGETS.total) * 100);

  // Deduct points for recommendations
  const errorCount = analysis.recommendations.filter(r => r.type === 'error').length;
  const warningCount = analysis.recommendations.filter(r => r.type === 'warning').length;
  
  score -= errorCount * 20;
  score -= warningCount * 10;

  return Math.max(0, Math.round(score));
}

function compareWithPrevious() {
  const analysisFiles = fs.readdirSync(ANALYSIS_OUTPUT_DIR)
    .filter(file => file.startsWith('analysis-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (analysisFiles.length < 2) {
    log('📊 No previous analysis found for comparison', 'yellow');
    return;
  }

  const current = JSON.parse(fs.readFileSync(
    path.join(ANALYSIS_OUTPUT_DIR, analysisFiles[0]), 'utf8'
  ));
  const previous = JSON.parse(fs.readFileSync(
    path.join(ANALYSIS_OUTPUT_DIR, analysisFiles[1]), 'utf8'
  ));

  const sizeDiff = current.totalSize - previous.totalSize;
  const percentDiff = ((sizeDiff / previous.totalSize) * 100).toFixed(2);

  log('\n📈 Size Comparison with Previous Build:', 'blue');
  
  if (sizeDiff > 0) {
    log(`  📈 Increased by ${formatBytes(sizeDiff)} (+${percentDiff}%)`, 'red');
  } else if (sizeDiff < 0) {
    log(`  📉 Decreased by ${formatBytes(Math.abs(sizeDiff))} (${percentDiff}%)`, 'green');
  } else {
    log(`  ➡️  No change in size`, 'blue');
  }
}

function generateOptimizationSuggestions() {
  log('\n🚀 Optimization Suggestions:', 'blue');
  
  const suggestions = [
    '1. Use dynamic imports for non-critical features',
    '2. Implement tree shaking for unused code',
    '3. Optimize images with Next.js Image component',
    '4. Use bundle analyzer to identify large dependencies',
    '5. Consider code splitting by route or feature',
    '6. Minimize third-party library usage',
    '7. Use compression (gzip/brotli) in production',
    '8. Implement lazy loading for heavy components',
  ];

  suggestions.forEach(suggestion => {
    log(`  💡 ${suggestion}`, 'yellow');
  });
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('Widget Bundle Analyzer', 'bold');
    log('Usage: node analyze-widget-bundle.js [options]', 'blue');
    log('Options:');
    log('  --compare    Compare with previous analysis');
    log('  --suggest    Show optimization suggestions');
    log('  --help       Show this help message');
    return;
  }

  analyzeBundle();

  if (args.includes('--compare')) {
    compareWithPrevious();
  }

  if (args.includes('--suggest')) {
    generateOptimizationSuggestions();
  }

  log('\n✨ Analysis complete!', 'green');
  log(`📁 Results saved to: ${ANALYSIS_OUTPUT_DIR}`, 'blue');
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundle,
  formatBytes,
  calculatePerformanceScore,
  BUNDLE_TARGETS,
};
