#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up development environment...');

// Create development configuration
const devConfig = {
  name: "Roblox Avatar Copier (DEV)",
  version: "1.0.0-dev",
  description: "Development version of Roblox Avatar Copier",
  developer_mode: true
};

// Read current manifest
const manifestPath = path.join(__dirname, '../manifest.json');
let manifest = {};

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  console.error('❌ Could not read manifest.json');
  process.exit(1);
}

// Update manifest for development
manifest.name = devConfig.name;
manifest.version = devConfig.version;
manifest.description = devConfig.description;

// Write development manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Development environment ready!');
console.log('📝 Available commands:');
console.log('   npm run dev        - Development build with watch mode');
console.log('   npm run build      - Production build (no obfuscation)');
console.log('   npm run package    - Final obfuscated build for distribution');
console.log('');
console.log('💡 Tips:');
console.log('   - Use "npm run dev" while developing');
console.log('   - Use "npm run package" before releasing');
console.log('   - Original source files are never modified');
console.log('   - Built files go to /dist folder'); 